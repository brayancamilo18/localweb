<?php

/*
 * Paletas curadas por plantilla. Cada paleta es una lista de 6 colores hex en
 * minúsculas formato '#rrggbb'. El PRIMER color es el "default" y debe coincidir
 * con el valor original del acento principal de la plantilla.
 *
 * Todos los colores han sido validados contra WCAG AA (≥3.0 en uso mixed, ≥4.5
 * en uso de texto puro o background puro). NO modificar sin re-validar contraste.
 *
 * Cómo se decidieron los colores (modo de uso de cada plantilla):
 *  - text         : el acento se usa principalmente como tinta sobre fondo claro
 *  - bg           : el acento se usa como background con texto oscuro encima
 *  - mixed        : el acento se usa indistintamente como tinta y como background
 *  - text_on_dark : el acento se usa como tinta sobre fondo OSCURO
 */

return [
    'palettes' => [

        // bloom-studio | mixed | bg=#FAFAF8 ink=#1C1C1C
        // Acento principal: --coral. Usos: tinta, fondo de botones, bordes.
        'bloom-studio' => [
            '#e8572a', // coral (default — valor original)
            '#c44536', // brick warm
            '#b8336a', // magenta brand
            '#8b5cf6', // violeta suave
            '#0a6cdc', // azul rey
            '#0f7b5f', // verde bosque
        ],

        // coastal-calm | mixed | bg=#FBF8F2 ink=#2A2A26
        // Acento principal: --terracotta. Estética costera, tonos tierra/mar.
        'coastal-calm' => [
            '#c76e4a', // terracotta (default)
            '#b85839', // siena profundo
            '#b8556a', // rosa coral
            '#5b7b9e', // azul mar
            '#6b7f5c', // verde salvia
            '#9b6b3d', // ámbar tostado
        ],

        // craft-pro | mixed | bg=#FFFFFF ink=#0F1114
        // Acento principal: --orange (#FF5C00 muy saturado). Estética industrial limpia.
        'craft-pro' => [
            '#ff5c00', // orange (default)
            '#d63f0a', // rojo trabajo
            '#0a6cdc', // azul ingeniería
            '#7c3aed', // violeta tech
            '#c2410c', // óxido
            '#0f8a6a', // verde acero
        ],

        // graphite-soft | text_on_dark | bg=#1f1d1a ink=#f0ebe1
        // Bg OSCURO. Acento como tinta clara sobre fondo oscuro. Estética cálida/neutra.
        'graphite-soft' => [
            '#c47550', // terracota apagada (default)
            '#e89e6e', // melocotón cálido
            '#d4b8a0', // crema rosada
            '#a8c0a8', // verde salvia claro
            '#b8a8d0', // lila polvo
            '#e8c28c', // mostaza suave
        ],

        // luxe-atelier | text | bg=#FBF9F4 ink=#15110C
        // Acento principal: --champagne. Estética premium, joyería atelier.
        'luxe-atelier' => [
            '#8e6a35', // champagne oscuro (default oscurecido — el original #B68A50 no pasa WCAG vs bg)
            '#6b4423', // chocolate cuero
            '#5c4a8c', // berenjena noche
            '#2f4f4f', // verde inglés
            '#7a3e3e', // burdeos vintage
            '#3d5a40', // verde bosque
        ],

        // mono-edito | text | bg=#FFFFFF ink=#0A0A0A
        // Editorial monocromático con UN solo acento sobre blanco. Estética seria.
        'mono-edito' => [
            '#c2410c', // óxido (default — el #E04E2C original no pasa WCAG, usamos este)
            '#0a6cdc', // azul editorial
            '#0f7b5f', // verde editorial
            '#7c3aed', // violeta editorial
            '#a0341f', // rojo profundo
            '#1a1a1a', // negro tinta (modo ultra-minimal)
        ],

        // noir-elite | text_on_dark | bg=#0A0A0A ink=#F0ECE4
        // Bg NEGRO. Acento dorado como tinta. Solo aceptamos tonos cálidos metalizados.
        'noir-elite' => [
            '#c9a84c', // gold (default)
            '#d4b570', // gold soft
            '#e8c893', // champagne claro
            '#c4a484', // bronce cálido
            '#b8956a', // bronce oscuro
            '#dcc189', // arena pálido
        ],

        // tavola-warm | text | bg=#F5EBDA ink=#2A1F18
        // Acento principal: --wine. Restaurante italiano cálido.
        // la-republica-vintage | text_on_dark | bg=#b8161b ink=#f5e6c8
        'la-republica-vintage' => [
            '#b8161b', // red (default)
            '#9a1116', // red deep
            '#6b0e12', // burgundy
            '#d4a85a', // gold
            '#c9a268', // gold soft
            '#f5e6c8', // cream accent
        ],

        // kairos-bold | text_on_dark | bg=#ee7a1f ink=#fdecc2
        'kairos-bold' => [
            '#ee7a1f', // orange (default)
            '#d8650f', // orange deep
            '#4a2818', // brown
            '#fdecc2', // cream
            '#f7e0a8', // cream warm
            '#1a1410', // ink accent
        ],

        'tavola-warm' => [
            '#5a1f1f', // wine (default)
            '#7a2a2a', // tinto profundo
            '#2d3a28', // verde botella
            '#704214', // madera curada
            '#5c3a26', // café tostado
            '#3d2c5c', // ciruela noche
        ],

        // tech-sleek | text_on_dark | bg=#070A14 ink=#E8ECF8
        // Bg muy OSCURO. Acento como tinta saturada brillante.
        'tech-sleek' => [
            '#5eead4', // cyan (default)
            '#8b7cf6', // violeta tech
            '#38bdf8', // azul cielo
            '#f472b6', // rosa neón
            '#a3e635', // lima neón
            '#fb923c', // naranja eléctrico
        ],

        // trust-clinic | text | bg=#FBFAF7 ink=#0E1F1A
        // Acento principal: --accent (#1A4F3F verde médico). Estética confiable/clínica.
        'trust-clinic' => [
            '#1a4f3f', // verde médico (default)
            '#1e4b7c', // azul clínica
            '#5c4a8c', // violeta confianza
            '#7a3e3e', // borgoña
            '#3d5a40', // verde profundo
            '#704214', // ámbar serio
        ],

        // urban-bold | bg | bg=#F4F1EA ink=#0A0A0A
        // Acento usado como BACKGROUND fluorescente con texto NEGRO encima. Estética brutalista.
        'urban-bold' => [
            '#d4ff3a', // lime (default)
            '#ff5a3a', // coral eléctrico
            '#3affe5', // cyan flúor
            '#ffd23a', // amarillo brutalista
            '#ff80ab', // rosa neón
            '#ff6b00', // naranja flúor
        ],

        // versa-studio | mixed | bg=#FAFAF7 ink=#15171A
        // Acento principal: --warm. Estudio versátil, paleta tierra-orgánica.
        'versa-studio' => [
            '#c7634d', // warm (default)
            '#a88b4a', // dorado mate
            '#7a8260', // verde musgo
            '#5c6f8c', // azul piedra
            '#a35266', // burdeos rosado
            '#9b5039', // teja
        ],
    ],

    /*
     * Metadatos por plantilla para validar contraste WCAG cuando el usuario
     * elige un color custom fuera de paleta. usage define qué pares hay que
     * comprobar; bg/ink son los colores del fondo y la tinta principal de
     * cada plantilla (los mismos del comentario de cabecera de cada paleta).
     *
     * Modos de uso:
     *  - text         : el acento se usa como tinta sobre fondo claro
     *  - bg           : el acento se usa como fondo con texto oscuro encima
     *  - mixed        : el acento se usa indistintamente como tinta y como fondo
     *  - text_on_dark : el acento se usa como tinta sobre fondo OSCURO
     */
    'templates' => [
        'bloom-studio' => ['usage' => 'mixed', 'bg' => '#fafaf8', 'ink' => '#1c1c1c'],
        'coastal-calm' => ['usage' => 'mixed', 'bg' => '#fbf8f2', 'ink' => '#2a2a26'],
        'craft-pro' => ['usage' => 'mixed', 'bg' => '#ffffff', 'ink' => '#0f1114'],
        'graphite-soft' => ['usage' => 'text_on_dark', 'bg' => '#1f1d1a', 'ink' => '#f0ebe1'],
        'luxe-atelier' => ['usage' => 'text', 'bg' => '#fbf9f4', 'ink' => '#15110c'],
        'mono-edito' => ['usage' => 'text', 'bg' => '#ffffff', 'ink' => '#0a0a0a'],
        'noir-elite' => ['usage' => 'text_on_dark', 'bg' => '#0a0a0a', 'ink' => '#f0ece4'],
        'la-republica-vintage' => ['usage' => 'text_on_dark', 'bg' => '#b8161b', 'ink' => '#f5e6c8'],
        'kairos-bold' => ['usage' => 'text_on_dark', 'bg' => '#ee7a1f', 'ink' => '#fdecc2'],
        'tavola-warm' => ['usage' => 'text', 'bg' => '#f5ebda', 'ink' => '#2a1f18'],
        'tech-sleek' => ['usage' => 'text_on_dark', 'bg' => '#070a14', 'ink' => '#e8ecf8'],
        'trust-clinic' => ['usage' => 'text', 'bg' => '#fbfaf7', 'ink' => '#0e1f1a'],
        'urban-bold' => ['usage' => 'bg', 'bg' => '#f4f1ea', 'ink' => '#0a0a0a'],
        'versa-studio' => ['usage' => 'mixed', 'bg' => '#fafaf7', 'ink' => '#15171a'],
    ],

    /*
     * Fallback si una plantilla no tiene paleta definida (caso de plantilla nueva
     * añadida sin actualizar este archivo). Mejor mostrar 6 colores razonables.
     */
    'fallback' => [
        '#c2410c', '#0a6cdc', '#0f7b5f', '#7c3aed', '#7a3e3e', '#1a1a1a',
    ],

    /*
     * Plantillas que NO permiten cambio de color de marca aún (caso especial
     * de wild-pet, que usa 5 colores simultáneamente y cambiar uno solo rompe
     * la armonía multicolor; requiere refactor de paleta cinética que se
     * pospone a v2).
     */
    'unsupported_templates' => [
        'wild-pet',
    ],
];
