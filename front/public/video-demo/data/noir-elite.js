/**
 * Demo Atelier Lúmina — Noir Elite (temporal, solo grabación de vídeo).
 * Restaurante de alta cocina · Salamanca, Madrid.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Sala del restaurante — hero (URL verificada HTTP 200). */
  var HERO = U('photo-1517248135467-4c7edcad34c4', 1400);

  /** 10 fotos gastronomía sofisticada — todas comprobadas. */
  var GALLERY = [
    U('photo-1414235077428-338989a2e8c0', 900),
    U('photo-1424847651672-bf20a4b0982b', 900),
    U('photo-1540189549336-e6e99c3679fe', 900),
    U('photo-1504674900247-0877df9cc836', 900),
    U('photo-1467003909585-2f8a72700288', 900),
    U('photo-1555396273-367ea4eb4db5', 900),
    U('photo-1551218808-94e220e084d2', 900),
    U('photo-1544025162-d76694265947', 900),
    U('photo-1559339352-11d035aa65de', 900),
    U('photo-1528605248644-14dd04022da1', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'noir-elite',
    title: 'Atelier Lúmina',
    subtitle: 'Noir Elite · Alta cocina · Salamanca, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Atelier Lúmina',
      tagline: 'Alta cocina · Barrio de Salamanca, Madrid',
      telefono: '+34915342109',
      whatsapp: '34915342109',
      portada: HERO,
      portada_2: '',
      portada_3: '',
      descripcion:
        'Atelier Lúmina propone una cocina de autor, técnica y honesta, en una sala íntima de cuarenta cubiertos. Producto de temporada, proveedores de confianza y una carta que se reescribe cada mes. Servicio pausado, maridajes pensados y una bodega con referencias pequeñas y clásicos imprescindibles. Reserva imprescindible. Dress code smart casual.',
      about_title: 'Cocina de precisión, trato de salón',
      about_sections: [
        {
          title: 'La sala',
          description:
            'Iluminación tenue, mesas bien separadas y mantelería de lino. Ambiente silencioso pensado para cenas largas y conversación sin prisas.',
          image_url: GALLERY[5],
        },
        {
          title: 'La cocina',
          description:
            'Abierta a la barra en parte del servicio. Fuego, brasa fina y trabajo minucioso en salsas, fondos y fermentaciones propias.',
          image_url: GALLERY[8],
        },
        {
          title: 'Bodega',
          description:
            'Más de doscientas referencias entre burdeos añejos, vinos de autor españoles y cavas de gran reserva. Sommelier en sala de miércoles a sábado.',
          image_url: GALLERY[0],
        },
      ],
      foto_equipo: GALLERY[8],
      direccion: 'Calle de Jorge Juan, 17 · 28001 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2019',
      correo: 'reservas@atelierlumina.es',
      galeria: GALLERY,
      horario: {
        mon: { closed: true },
        tue: { open: '13:30', close: '23:00' },
        wed: { open: '13:30', close: '23:00' },
        thu: { open: '13:30', close: '23:00' },
        fri: { open: '13:30', close: '23:30' },
        sat: { open: '13:30', close: '23:30' },
        sun: { closed: true },
      },
      map_lat: 40.4245,
      map_lon: -3.6842,
      services: [
        {
          name: 'Menú degustación 7 pases',
          price: 95,
          description:
            'Recorrido por lo mejor de la temporada: crudo, verdura, pescado, carne, queso y dos postres. Servicio de 2 h 30 aprox.',
        },
        {
          name: 'Menú maridaje premium',
          price: 145,
          description:
            'Degustación de siete pases con seis copas seleccionadas por el sumiller. Incluye aperitivo de bienvenida.',
        },
        {
          name: 'Entradas para compartir',
          price: 38,
          description:
            'Selección de tres piezas frías y calientes del día: ostras, tartar o verdura asada según mercado.',
        },
        {
          name: 'Rodaballo salvaje',
          price: 42,
          description:
            'Filete a la brasa con emulsión de azafrán y pilpil de almejas. Pescado del Cantábrico según llegada.',
        },
        {
          name: 'Solomillo Dry Aged',
          price: 48,
          description:
            'Maduración 45 días, jugo de asado reducido y puré de apionabo trufado. Punto recomendado: término medio.',
        },
        {
          name: 'Maridaje por copas',
          price: 32,
          description:
            'Cuatro vinos en copa acompañando platos a la carta. Ideal si no quieres el menú completo.',
        },
        {
          name: 'Chef\'s table (4 pax)',
          price: 180,
          description:
            'Mesa junto a cocina, menú sorpresa de nueve pases y maridaje. Miércoles y jueves con reserva previa.',
        },
        {
          name: 'Almuerzo ejecutivo',
          price: 35,
          description:
            'De martes a viernes: entrante, principal y postre. Servicio ágil entre 13:30 y 15:00. Bebida no incluida.',
        },
        {
          name: 'Postre de autor',
          price: 14,
          description:
            'Creación del pastelero: texturas, cítricos o chocolate según la carta del mes. Maridaje dulce opcional.',
        },
        {
          name: 'Carta de quesos y digestivos',
          price: 22,
          description:
            'Selección de cinco piezas nacionales y europeas con miel, nueces y copa de Oporto o licor artesanal.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.4245,-3.6842',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/atelier-lumina.vcf',
      is_pro: true,
      subdomain: 'atelier-lumina-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
