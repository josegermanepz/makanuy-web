#!/usr/bin/env python3
"""Mechanical, repeatable upgrades for the v5 review branch."""

from pathlib import Path
import html
import json
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


def inject_schema(source: str, schema: dict) -> str:
    source = re.sub(r'<script type="application/ld\+json" data-makanuy-schema>.*?</script>', '', source, flags=re.S | re.I)
    payload = json.dumps(schema, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return source.replace('</head>', f'<script type="application/ld+json" data-makanuy-schema>{payload}</script></head>', 1)


def main() -> None:
    services = (ROOT / 'servicios.html').read_text()
    style_match = re.search(r'<style>(.*?)</style>', services, re.S | re.I)
    base = style_match.group(1) if style_match else (ROOT / 'legacy-base.css').read_text()
    (ROOT / 'legacy-base.css').write_text(base)

    for path in HTML_FILES:
        source = path.read_text()
        source = re.sub(r'<script defer>const t=document\.querySelector\(\'\.menu-toggle\'\).*?</script>', '', source, flags=re.S)
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
            source = source.replace('</head>', '<link rel="stylesheet" href="/v5.css?v=20260804a"></head>', 1)
        else:
            source = re.sub(r'href="/v5\.css(?:\?[^\"]*)?"', 'href="/v5.css?v=20260804a"', source)
        source = add_social_metadata(source)
        source = dedupe_metadata(source)
        source = upgrade_images(source)
        if '<header class="site-header">' in source and 'class="menu-toggle"' not in source:
            source = source.replace('<nav id="menu"', '<button class="menu-toggle" aria-expanded="false" aria-controls="menu">Menú</button><nav id="menu"', 1)
        if '/analytics.js' not in source:
            enhancements = '<script src="/site-enhancements.js" defer></script>'
            if enhancements in source:
                source = source.replace(enhancements, '<script src="/analytics.js" defer></script>' + enhancements, 1)
            else:
                source = source.replace('</body>', '<script src="/analytics.js" defer></script></body>', 1)
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
            'src="/image-031.jpg" alt="Agua mineral"': 'src="/assets/images/calculator-water-v2.webp" alt="Calculadora educativa de consumo de agua"',
            'src="/assets/images/calculator-water-v2.png"': 'src="/assets/images/calculator-water-v2.webp"',
            '<body><a class="skip"': '<body class="resources-page"><a class="skip"',
        },
        'recomendaciones.html': {
            '<body><a class="skip"': '<body class="recommendations-page"><a class="skip"',
            "url('/image-027.png')": "url('/assets/images/recommendations-hero.webp')",
            'src="/image-033.png" alt="Avena"': 'src="/assets/images/avena-quaker-oats.webp" alt="Quaker Oats hojuelas de avena integral"',
            'src="/assets/images/avena-quaker-oats.png"': 'src="/assets/images/avena-quaker-oats.webp"',
            'src="/assets/images/calculator-water-v2.png"': 'src="/assets/images/calculator-water-v2.webp"',
            'src="/assets/images/calculator-equivalents-v2.png"': 'src="/assets/images/calculator-equivalents-v2.webp"',
            '<section class="section"><h2>Alimentos</h2>': '<section class="section"><div class="review-note"><strong>Guía revisada en agosto de 2026</strong><p>La selección considera practicidad, disponibilidad y características generales del producto. No existe una marca obligatoria y la mejor elección depende del contexto y del plan individual.</p></div><h2>Alimentos</h2>',
            '<script src="/site-ui.js" defer></script>': '<script src="/recommendations-ui.js" defer></script><script src="/site-ui.js" defer></script>',
        },
        'index.html': {
            'src="/image-059.jpg" alt="Alimentos variados para una consulta de bienestar"': 'src="/assets/images/service-bienestar-cover.webp" alt="Alimentos variados para una consulta de bienestar"',
            'src="/image-014.jpg" alt="Mujeres en diferentes etapas de vida"': 'src="/assets/images/service-women-cover.webp" alt="Mujeres en diferentes etapas de vida"',
            'src="/image-060.jpg" alt="Alimentación equilibrada para acompañamiento nutricional en línea"': 'src="/assets/images/service-online-cover.webp" alt="Alimentación equilibrada para acompañamiento nutricional en línea"',
            '<p class="lead">En Makanuy construimos una estrategia que considera tu etapa de vida, tus objetivos, tus hábitos y tu rutina. Con educación nutricional, acompañamiento y cambios que puedas sostener. El paciente no tiene que adaptarse a la comida: la alimentación se adapta a la persona.</p>': (
                '<p class="lead hero-intro"><span class="hero-intro__desktop">En Makanuy construimos una estrategia que considera tu etapa de vida, tus objetivos, tus hábitos y tu rutina. Con educación nutricional, acompañamiento y cambios que puedas sostener. El paciente no tiene que adaptarse a la comida: la alimentación se adapta a la persona.</span>'
                '<span class="hero-intro__mobile">En Makanuy creamos una estrategia para tu vida, hábitos y objetivos. La alimentación se adapta a ti, no tú a la comida.</span></p>'
            ),
        },
        'agendar.html': {
            '<section data-booking-stage="date" hidden><h2>Selecciona fecha y hora</h2>': '<section data-booking-stage="date" hidden><h2 tabindex="-1">Selecciona fecha y hora</h2><p class="booking-timezone">Horarios de Ciudad de México (UTC−6). La disponibilidad se consulta directamente en el calendario de Yunuen.</p><button class="button booking-next-slot" type="button" data-find-next>Buscar el próximo horario</button>',
            '<section data-booking-stage="details" hidden><h2>Datos para confirmar</h2>': '<section data-booking-stage="details" hidden><h2 tabindex="-1">Datos para confirmar</h2><p id="chosen-booking" class="chosen-booking"></p>',
            '<section data-booking-stage="service"><h2>Elige el acompañamiento</h2>': '<section data-booking-stage="service"><h2 tabindex="-1">Elige el acompañamiento</h2>',
            '<div class="success"><h2>Recibimos tu solicitud</h2>': '<div class="success"><h2 tabindex="-1">Recibimos tu solicitud</h2>',
        },
        'cookies.html': {
            'Última actualización: 19 de julio de 2026': 'Última actualización: 4 de agosto de 2026',
            '<p>El sitio utiliza únicamente recursos técnicos necesarios para navegación, seguridad y funcionamiento de la agenda. No se utiliza analítica publicitaria ni se crean perfiles de publicidad en esta versión.</p>': '<p>El sitio utiliza recursos técnicos necesarios para navegación, seguridad y funcionamiento de la agenda. También registra medición agregada y propia —por ejemplo, la página visitada y las acciones principales— sin cookies publicitarias, sin almacenar la dirección IP y sin crear perfiles personales.</p>',
            '<h2>Si se activa medición</h2><p>Antes de habilitar cookies o identificadores no esenciales, la página ofrecerá una opción para aceptar o rechazar y esta política indicará el proveedor, finalidad y duración.</p>': '<h2>Medición sin cookies</h2><p>Los eventos técnicos se conservan hasta 90 días para comprender el uso del sitio y detectar fallas. Si posteriormente se habilitan cookies o identificadores no esenciales, la página ofrecerá una opción para aceptar o rechazar.</p>',
        },
        'privacidad.html': {
            'Última actualización: 19 de julio de 2026': 'Última actualización: 4 de agosto de 2026',
            '<li>Prevenir abuso y mantener la seguridad del sitio.</li>': '<li>Prevenir abuso y mantener la seguridad del sitio.</li><li>Analizar de forma agregada el uso de las páginas y las acciones principales, sin registrar diagnósticos ni contenidos escritos en formularios.</li>',
            '<p>La información se conserva durante el tiempo necesario para atender la solicitud y cumplir obligaciones aplicables. El acceso se limita a Makanuy y a los proveedores necesarios para operar el servicio.</p>': '<p>La información se conserva durante el tiempo necesario para atender la solicitud y cumplir obligaciones aplicables. Los eventos técnicos y anónimos del sitio se eliminan después de 90 días. El acceso se limita a Makanuy y a los proveedores necesarios para operar el servicio.</p>',
        },
    }
    for filename, changes in replacements.items():
        path = ROOT / filename
        source = path.read_text()
        for old, new in changes.items():
            source = source.replace(old, new)
        source = source.replace('<script src="/recommendations-ui.js" defer></script><script src="/recommendations-ui.js" defer></script>', '<script src="/recommendations-ui.js" defer></script>')
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

    faq = ROOT / 'preguntas-frecuentes.html'
    source = faq.read_text()
    entries = re.findall(r'<details[^>]*>\s*<summary>(.*?)</summary>\s*<p>(.*?)</p>', source, re.S | re.I)
    faq_schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': re.sub(r'<[^>]+>', '', question).strip(),
                'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', answer).strip()},
            }
            for question, answer in entries
        ],
    }
    faq.write_text(inject_schema(source, faq_schema))

    about = ROOT / 'sobre-yunuen.html'
    about_schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Yunuen Figueroa González',
        'jobTitle': 'Nutrióloga',
        'url': 'https://www.makanuyconsultas.com/yunuen-figueroa/',
        'worksFor': {'@type': 'ProfessionalService', 'name': 'Makanuy'},
        'sameAs': ['https://www.instagram.com/yunfig/'],
    }
    about.write_text(inject_schema(about.read_text(), about_schema))

    service_pages = {
        'servicios-consulta-bienestar-composicion-corporal.html': ('Consulta Bienestar/Composición Corporal', 850),
        'servicios-consulta-de-nutricion-hormonal.html': ('Consulta de Nutrición Hormonal', 850),
        'servicios-consulta-de-embarazo.html': ('Consulta de Embarazo', 850),
        'servicios-consulta-para-el-climaterio-y-menopausia.html': ('Consulta para el Climaterio y Menopausia', 850),
        'servicios-consulta-de-nutricion-y-sistema-inmune.html': ('Consulta de Nutrición y Sistema Inmune', 850),
        'servicios-tanita-bioempedancia.html': ('Tanita (Bioimpedancia)', 300),
        'servicios-consulta-online-1.html': ('Consulta Online', 800),
    }
    for filename, (name, price) in service_pages.items():
        path = ROOT / filename
        canonical = attr(re.search(r'<link rel="canonical"[^>]*>', path.read_text()).group(0), 'href')
        schema = {
            '@context': 'https://schema.org', '@type': 'Service', 'name': name,
            'url': canonical, 'provider': {'@type': 'ProfessionalService', 'name': 'Makanuy'},
            'areaServed': 'México',
            'offers': {'@type': 'Offer', 'price': price, 'priceCurrency': 'MXN', 'availability': 'https://schema.org/InStock'},
        }
        path.write_text(inject_schema(path.read_text(), schema))

    recipes = ROOT / 'recetas.html'
    recipe_list_schema = {
        '@context': 'https://schema.org', '@type': 'ItemList', 'name': 'Recetarios Makanuy',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'url': 'https://www.makanuyconsultas.com/recetas/rollitos-del-mar/', 'name': 'Rollitos del Mar'},
            {'@type': 'ListItem', 'position': 2, 'url': 'https://www.makanuyconsultas.com/recetas/tostadas-crunch-de-atun-tropical/', 'name': 'Tostadas Crunch de Atún Tropical'},
        ],
    }
    recipes.write_text(inject_schema(recipes.read_text(), recipe_list_schema))


if __name__ == '__main__':
    main()
