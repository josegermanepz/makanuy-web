#!/usr/bin/env python3
"""Mechanical, repeatable upgrades for the v5 review branch."""

from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("*.html"))


def attr(tag: str, name: str) -> str:
    match = re.search(rf'\b{name}="([^"]*)"', tag, re.I)
    return html.unescape(match.group(1)) if match else ""


def upgrade_images(source: str) -> str:
    def replace(match: re.Match[str]) -> str:
        tag = match.group(0)
        if 'loading=' not in tag and '/logo.png' not in tag and 'hero-v4__portrait' not in tag:
            tag = tag[:-1] + ' loading="lazy">'
        if 'decoding=' not in tag:
            tag = tag[:-1] + ' decoding="async">'
        return tag

    return re.sub(r'<img\b[^>]*>', replace, source, flags=re.I)


def add_social_metadata(source: str) -> str:
    if 'property="og:url"' in source:
        return source
    title_match = re.search(r'<title>(.*?)</title>', source, re.S | re.I)
    desc_match = re.search(r'<meta name="description" content="([^"]*)">', source, re.I)
    canonical_match = re.search(r'<link rel="canonical" href="([^"]*)">', source, re.I)
    if not title_match or not canonical_match:
        return source
    title = html.escape(re.sub(r'\s+', ' ', title_match.group(1)).strip(), quote=True)
    description = html.escape(desc_match.group(1) if desc_match else 'Nutrición personalizada, práctica y sin culpa con Makanuy.', quote=True)
    canonical = html.escape(canonical_match.group(1), quote=True)
    image = 'https://www.makanuyconsultas.com/hero-collage.avif'
    metadata = (
        f'<meta property="og:type" content="website"><meta property="og:locale" content="es_MX">'
        f'<meta property="og:site_name" content="Makanuy"><meta property="og:title" content="{title}">'
        f'<meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}">'
        f'<meta property="og:image" content="{image}"><meta name="twitter:card" content="summary_large_image">'
        f'<meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{description}">'
        f'<meta name="twitter:image" content="{image}">'
    )
    return source.replace('</head>', metadata + '</head>', 1)


def dedupe_metadata(source: str) -> str:
    seen: set[tuple[str, str]] = set()

    def replace(match: re.Match[str]) -> str:
        tag = match.group(0)
        key_match = re.search(r'\b(property|name)="([^"]+)"', tag, re.I)
        if not key_match:
            return tag
        key = (key_match.group(1).lower(), key_match.group(2).lower())
        if key in seen:
            return ''
        seen.add(key)
        return tag

    return re.sub(r'<meta\b[^>]*>', replace, source, flags=re.I)


def main() -> None:
    services = (ROOT / 'servicios.html').read_text()
    style_match = re.search(r'<style>(.*?)</style>', services, re.S | re.I)
    base = style_match.group(1) if style_match else (ROOT / 'legacy-base.css').read_text()
    (ROOT / 'legacy-base.css').write_text(base)

    for path in HTML_FILES:
        source = path.read_text()
        match = re.search(r'<style>(.*?)</style>', source, re.S | re.I)
        if match and match.group(1).startswith(base):
            remainder = match.group(1)[len(base):]
            replacement = f'<style>{remainder}</style>' if remainder else ''
            source = source[:match.start()] + replacement + source[match.end():]
            if '/legacy-base.css' not in source:
                marker = '<link rel="stylesheet" href="/wix-parity.css">'
                link = '<link rel="stylesheet" href="/legacy-base.css">'
                source = source.replace(marker, link + marker, 1)

        if '/v5.css' not in source:
            source = source.replace('</head>', '<link rel="stylesheet" href="/v5.css"></head>', 1)
        source = add_social_metadata(source)
        source = dedupe_metadata(source)
        source = upgrade_images(source)
        if ('data-api-form=' in source or 'id="booking-form"' in source) and '/turnstile.js' not in source:
            source = source.replace('</body>', '<script src="/turnstile.js" defer></script></body>', 1)
        path.write_text(source)

    replacements = {
        'servicios.html': {
            'src="/image-065.jpg"': 'src="/servicio-tanita.avif"',
            'src="/image-067.jpg"': 'src="/hero-consulta.avif"',
        },
        'recetas.html': {
            'src="/image-001.png" alt="Rollitos': 'src="/receta-rollitos.avif" alt="Rollitos',
            'src="/image-001.png" alt="Tostadas': 'src="/receta-tostadas.avif" alt="Tostadas',
        },
        'recursos.html': {
            'src="/image-031.jpg" alt="Agua mineral"': 'src="/assets/images/calculator-water-v2.png" alt="Calculadora educativa de consumo de agua"',
            '<body><a class="skip"': '<body class="resources-page"><a class="skip"',
            'href="/v5.css"': 'href="/v5.css?v=20260802a"',
        },
        'recomendaciones.html': {
            '<body><a class="skip"': '<body class="recommendations-page"><a class="skip"',
            'src="/image-033.png" alt="Avena"': 'src="/assets/images/avena-quaker-oats.png" alt="Quaker Oats hojuelas de avena integral"',
            'href="/v5.css"': 'href="/v5.css?v=20260802a"',
        },
        'index.html': {
            'href="/v5.css"': 'href="/v5.css?v=20260802a"',
            '<p class="lead">En Makanuy construimos una estrategia que considera tu etapa de vida, tus objetivos, tus hábitos y tu rutina. Con educación nutricional, acompañamiento y cambios que puedas sostener. El paciente no tiene que adaptarse a la comida: la alimentación se adapta a la persona.</p>': (
                '<p class="lead hero-intro"><span class="hero-intro__desktop">En Makanuy construimos una estrategia que considera tu etapa de vida, tus objetivos, tus hábitos y tu rutina. Con educación nutricional, acompañamiento y cambios que puedas sostener. El paciente no tiene que adaptarse a la comida: la alimentación se adapta a la persona.</span>'
                '<span class="hero-intro__mobile">En Makanuy creamos una estrategia para tu vida, hábitos y objetivos. La alimentación se adapta a ti, no tú a la comida.</span></p>'
            ),
        },
    }
    for filename, changes in replacements.items():
        path = ROOT / filename
        source = path.read_text()
        for old, new in changes.items():
            source = source.replace(old, new)
        path.write_text(source)

    contact = ROOT / 'contacto.html'
    source = contact.read_text()
    marker = '<h3 style="margin-top:35px">¿Representas a una empresa?</h3>'
    if 'data-api-form="contact"' not in source and marker in source:
        form = (
            '<form class="contact-form" data-api-form="contact" method="post">'
            '<input type="hidden" name="type" value="contact">'
            '<div class="hp-field" aria-hidden="true"><label>Deja este campo vacío<input name="companyWebsite" tabindex="-1" autocomplete="off"></label></div>'
            '<h2>Envíanos un mensaje</h2><p class="form-note">Comparte solo información general. No envíes estudios ni datos clínicos sensibles.</p>'
            '<div class="form-grid"><label>Nombre<input name="name" autocomplete="name" required maxlength="120"></label>'
            '<label>Correo<input name="email" type="email" autocomplete="email" required maxlength="180"></label>'
            '<label class="wide">Teléfono (opcional)<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>'
            '<label class="wide">¿Cómo podemos orientarte?<textarea name="message" required maxlength="1200"></textarea></label>'
            '<label class="wide"><input name="privacy" type="checkbox" required> Leí el <a href="/privacidad.html" target="_blank">aviso de privacidad</a>.</label></div>'
            '<button class="button dark" type="submit">Enviar mensaje</button><p class="form-status" role="status" aria-live="polite"></p></form>'
        )
        source = source.replace(marker, form + marker, 1)
    if '/forms.js' not in source:
        source = source.replace('<script src="/site-enhancements.js" defer></script>', '<script src="/forms.js" defer></script><script src="/site-enhancements.js" defer></script>', 1)
    if '/turnstile.js' not in source:
        source = source.replace('</body>', '<script src="/turnstile.js" defer></script></body>', 1)
    contact.write_text(source)

    legacy_quiz = ROOT / 'consulta-ideal.html'
    source = legacy_quiz.read_text()
    local_asset_map = {
        '73479aac924e4851978ae7ce3bd71c12': '/logo.png',
        '11062b_bd683722d3484398abd18f472ab31eec': '/image-059.jpg',
        '11062b_7abd3c294fde454592a4d8f605b187d7': '/image-060.jpg',
        'de0ab0f76d13a91e5833714f80c1dc3d': '/image-061.jpg',
        '11062b_a6b64592b4ac40b8aeb2080137114793': '/image-062.jpg',
        '0fe2fa_5bcd5773c59b41cda976cfd2b2edc5c1': '/image-013.jpg',
        '11062b_a703a9d779814f13be36844dc6fe7468': '/image-063.jpg',
        '464959f1d3094b31a98afdeca2a920f4': '/image-064.jpg',
    }
    for remote_id, local_path in local_asset_map.items():
        source = re.sub(rf'https://static\.wixstatic\.com/[^"\')]*{remote_id}[^"\')]*', local_path, source)
    if 'name="robots"' not in source:
        source = source.replace('</head>', '<meta name="robots" content="noindex,follow"></head>', 1)
    legacy_quiz.write_text(source)


if __name__ == '__main__':
    main()
