/**
 * Demo Trattoria La Tavola — Tavola Warm (temporal, solo grabación de vídeo).
 * Trattoria italiana · cocina de hogar · Chamberí, Madrid.
 * Todas las fotos: mismo universo (italiano, cálido, mesa compartida).
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Hero — tres fotos de la misma trattoria (URLs verificadas HTTP 200). */
  var HERO_1 = U('photo-1555396273-367ea4eb4db5', 1200);
  var HERO_2 = U('photo-1504674900247-0877df9cc836', 1000);
  var HERO_3 = U('photo-1414235077428-338989a2e8c0', 1000);

  /** 10 fotos — solo gastronomía italiana / trattoria. */
  var GALLERY = [
    U('photo-1414235077428-338989a2e8c0', 900),
    U('photo-1504674900247-0877df9cc836', 900),
    U('photo-1555396273-367ea4eb4db5', 900),
    U('photo-1565299624946-b28f40a0ae38', 900),
    U('photo-1551183053-bf91a1d81141', 900),
    U('photo-1466637574441-749b8f19452f', 900),
    U('photo-1424847651672-bf20a4b0982b', 900),
    U('photo-1540189549336-e6e99c3679fe', 900),
    U('photo-1517248135467-4c7edcad34c4', 900),
    U('photo-1559339352-11d035aa65de', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'tavola-warm',
    title: 'Trattoria La Tavola',
    subtitle: 'Tavola Warm · Trattoria italiana · Chamberí, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Trattoria La Tavola',
      tagline: 'Cocina italiana de hogar · Chamberí, Madrid',
      telefono: '+34915123456',
      whatsapp: '34915123456',
      portada: HERO_1,
      portada_2: HERO_2,
      portada_3: HERO_3,
      descripcion:
        'La Tavola es una trattoria pequeña donde la pasta se hace cada mañana y el ragù cuece tres horas. Recetas de Emilia y Toscana, vinos italianos sin postureo y mesas compartidas cuando hace frío. Manteles de papel, servilletas de tela y el olor a ajo y tomate al entrar. Reservas recomendadas el fin de semana; entre semana suele haber mesa sin avisar.',
      about_title: 'Recetas de la nonna, servicio de barrio',
      about_sections: [
        {
          title: 'La trattoria',
          description:
            'Sala de paredes color ocre, botellas en estantería y luz cálida. Cuarenta cubiertos, barra para dos y terraza con cuatro mesas cuando el tiempo acompaña.',
          image_url: GALLERY[2],
        },
        {
          title: 'Pasta fresca',
          description:
            'Laminadora propia, huevos de corral y harina de grano duro. Tagliatelle, pappardelle y ravioli rellenos cambian según la temporada.',
          image_url: GALLERY[4],
        },
        {
          title: 'La bodega',
          description:
            'Chianti, Primitivo y blancos del Friuli por copas o botella. El sommelier es el dueño y te recomienda sin complicaciones.',
          image_url: GALLERY[8],
        },
      ],
      foto_equipo: GALLERY[9],
      direccion: 'Calle de Almagro, 42 · 28010 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2016',
      correo: 'ciao@trattorialatavola.es',
      galeria: GALLERY,
      horario: {
        mon: { closed: true },
        tue: { open: '13:00', close: '23:30' },
        wed: { open: '13:00', close: '23:30' },
        thu: { open: '13:00', close: '23:30' },
        fri: { open: '13:00', close: '00:00' },
        sat: { open: '13:00', close: '00:00' },
        sun: { open: '13:00', close: '22:30' },
      },
      map_lat: 40.431,
      map_lon: -3.692,
      services: [
        {
          name: 'Antipasti della casa',
          price: 14,
          description:
            'Selección para compartir: bruschetta, burrata, prosciutto di Parma y aceitunas marinadas. Ración generosa para dos.',
        },
        {
          name: 'Tagliatelle al ragù',
          price: 16,
          description:
            'Pasta fresca con ragù de ternera y cerdo cocinado a fuego lento. Parmigiano Reggiano al gusto.',
        },
        {
          name: 'Risotto ai funghi',
          price: 17,
          description:
            'Arroz carnaroli, setas de temporada, mantequilla y un toque de vino blanco. Cremoso, sin exceso de queso.',
        },
        {
          name: 'Lasagna della nonna',
          price: 15,
          description:
            'Capas de pasta casera, bechamel ligera y ragù de la casa. Horneada al momento, porción contundente.',
        },
        {
          name: 'Pizza margherita DOC',
          price: 12,
          description:
            'Masa 72 h, tomate San Marzano, mozzarella fior di latte y albahaca. Horno de piedra a 450 °C.',
        },
        {
          name: 'Saltimbocca alla romana',
          price: 19,
          description:
            'Escalopes de ternera con prosciutto y salvia, reducción de vino blanco. Guarnición de patatas al romero.',
        },
        {
          name: 'Tiramisù casero',
          price: 6,
          description:
            'Receta de la familia: mascarpone, café espresso frío y cacao amargo. Hecho cada mañana.',
        },
        {
          name: 'Menú del día',
          price: 14.5,
          description:
            'De martes a viernes al mediodía: primero, segundo y postre. Incluye pan y bebida (agua o vino de mesa).',
        },
        {
          name: 'Vino de la casa (media)',
          price: 9,
          description:
            'Litro de tinto o blanco italiano de la casa. Ideal para acompañar pasta o pizza entre dos.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.431,-3.692',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/trattoria-la-tavola.vcf',
      is_pro: true,
      subdomain: 'trattoria-la-tavola-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
