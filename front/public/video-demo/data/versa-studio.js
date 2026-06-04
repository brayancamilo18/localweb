/**
 * Demo Versa Viajes — Versa Studio (temporal, solo grabación de vídeo).
 * Agencia de viajes a medida · Chamberí, Madrid.
 * Fotos coherentes: destinos, playas, rutas y documentación.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Hero — tres polaroids (URLs verificadas HTTP 200, mismas que la plantilla). */
  var HERO_1 = U('photo-1763990897241-c40923908537', 1200);
  var HERO_2 = U('photo-1552364708-8a19ac4e8923', 1000);
  var HERO_3 = U('photo-1693620714112-a79a7d27308b', 1000);

  /** 10 fotos agencia de viajes — todas comprobadas. */
  var GALLERY = [
    U('photo-1763990897241-c40923908537', 900),
    U('photo-1552364708-8a19ac4e8923', 900),
    U('photo-1693620714112-a79a7d27308b', 900),
    U('photo-1632178151697-fd971baa906f', 900),
    U('photo-1658476293101-4181a2afc8f4', 900),
    U('photo-1768751350689-07f19551adbd', 900),
    U('photo-1436491865332-7a61a109cc05', 900),
    U('photo-1469854523086-cc02fe5d8800', 900),
    U('photo-1507525428034-b723cf961d3e', 900),
    U('photo-1506905925346-21bda4d32df4', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'versa-studio',
    title: 'Versa Viajes',
    subtitle: 'Versa Studio · Agencia de viajes · Chamberí, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Versa Viajes',
      tagline: 'Agencia de viajes a medida · Chamberí, Madrid',
      telefono: '+34911234567',
      whatsapp: '34911234567',
      portada: HERO_1,
      portada_2: HERO_2,
      portada_3: HERO_3,
      descripcion:
        'Versa Viajes diseña escapadas, lunas de miel y viajes largos con el mismo cuidado que un buen mapa en la mesa. Te escuchamos primero: presupuesto, fechas y ritmo. Luego proponemos rutas reales, hoteles que conocemos y traslados sin sorpresas. Gestión de visados, seguros y asistencia en destino incluidos cuando toca. Oficina pequeña en Chamberí; también cerramos todo por videollamada si prefieres no desplazarte.',
      about_title: 'Tu viaje, diseñado contigo',
      about_sections: [
        {
          title: 'La agencia',
          description:
            'Equipo de cuatro agentes con experiencia en Europa, América y Asia. Sin catálogos genéricos: cada propuesta se arma a mano.',
          image_url: GALLERY[3],
        },
        {
          title: 'Viajes a medida',
          description:
            'Rutas flexibles, upgrades opcionales y tiempo libre bien repartido. Te mandamos un dossier claro antes de reservar nada.',
          image_url: GALLERY[7],
        },
        {
          title: 'Asistencia en destino',
          description:
            'WhatsApp directo con tu agente y contacto local de emergencia. Si un vuelo se retrasa, nos ocupamos de reproteger.',
          image_url: GALLERY[6],
        },
      ],
      foto_equipo: GALLERY[3],
      direccion: 'Calle de Ponzano, 33 · 28003 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2014',
      correo: 'hola@versaviajes.es',
      galeria: GALLERY,
      horario: {
        mon: { open: '10:00', close: '19:00' },
        tue: { open: '10:00', close: '19:00' },
        wed: { open: '10:00', close: '19:00' },
        thu: { open: '10:00', close: '20:00' },
        fri: { open: '10:00', close: '20:00' },
        sat: { open: '10:00', close: '14:00' },
        sun: { closed: true },
      },
      map_lat: 40.438,
      map_lon: -3.698,
      services: [
        {
          name: 'Escapada europea fin de semana',
          price: 299,
          description:
            'Vuelo + hotel céntrico 2 noches en ciudad a elegir (París, Roma, Lisboa). Desayuno incluido en hoteles seleccionados.',
        },
        {
          name: 'Luna de miel Caribe',
          price: 1890,
          description:
            '8 días en resort con traslados, seguro y una cena especial. Opción todo incluido o solo alojamiento.',
        },
        {
          name: 'Circuito Japón 12 días',
          price: 2450,
          description:
            'Tokio, Kioto y Hakone con JR Pass, hoteles 3–4 estrellas y guía en español en visitas imprescindibles.',
        },
        {
          name: 'City break Lisboa',
          price: 349,
          description:
            '3 noches en Chiado, vuelo desde Madrid o Barcelona y walking tour privado de medio día.',
        },
        {
          name: 'Safari Kenia 8 días',
          price: 2100,
          description:
            'Amboseli y Masai Mara en lodge confort, vuelos internos y guía ranger. Temporada seca recomendada.',
        },
        {
          name: 'Viaje en grupo Perú',
          price: 1650,
          description:
            'Lima, Cusco, Valle Sagrado y Machu Picchu. Grupo reducido, entradas y tren incluidos.',
        },
        {
          name: 'Crucero Mediterráneo',
          price: 890,
          description:
            '7 noches salida desde Barcelona. Cabina exterior, pensión completa a bordo y tasas portuarias.',
        },
        {
          name: 'Gestión de visados',
          price: 45,
          description:
            'Tramitación y revisión de documentación por persona. Honorarios de consulado aparte según país.',
        },
        {
          name: 'Seguro de viaje anual',
          price: 89,
          description:
            'Cobertura médica, cancelación y equipaje para viajes ilimitados de hasta 30 días cada uno en un año.',
        },
        {
          name: 'Asesoría viaje a medida',
          price: 0,
          description:
            'Primera consulta sin coste: cuéntanos fechas e idea y te enviamos propuesta en 48–72 h laborables.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.438,-3.698',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/versa-viajes.vcf',
      is_pro: true,
      subdomain: 'versa-viajes-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
