/**
 * Demo Bloom Atelier — Bloom Studio (temporal, solo grabación de vídeo).
 * Salón de belleza + spa · Chamberí, Madrid.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Spa / bienestar — hero (URL verificada HTTP 200). */
  var HERO = U('photo-1564501049412-61c2a3083791', 1400);

  /** 10 fotos salón + spa — todas comprobadas. */
  var GALLERY = [
    U('photo-1560066984-138dadb4c035', 900),
    U('photo-1522337360788-8b13dee7a37e', 900),
    U('photo-1605497788044-5a32c7078486', 900),
    U('photo-1487412947147-5cebf100ffc2', 900),
    U('photo-1562322140-8baeececf3df', 900),
    U('photo-1540555700478-4be289fbecef', 900),
    U('photo-1544161515-4ab6ce6db874', 900),
    U('photo-1540541338287-41700207dee6', 900),
    U('photo-1582719508461-905c673771fd', 900),
    U('photo-1578683010236-d716f9a3f461', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'bloom-studio',
    title: 'Bloom Atelier',
    subtitle: 'Bloom Studio · Salón & Spa · Chamberí, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Bloom Atelier',
      tagline: 'Salón de belleza & spa · Chamberí, Madrid',
      telefono: '+34913004455',
      whatsapp: '34913004455',
      portada: HERO,
      portada_2: '',
      portada_3: '',
      descripcion:
        'En Bloom Atelier unimos peluquería, estética y rituales de spa en un mismo espacio luminoso. Trabajamos con diagnóstico previo, productos de calidad y tiempos realistas: sin prisas ni sorpresas en la factura. Coloración, tratamientos de recuperación, manicura y masajes en cabina privada. Reserva por WhatsApp y te confirmamos en el día.',
      about_title: 'Belleza con calma, desde 2017',
      about_sections: [
        {
          title: 'El salón',
          description:
            'Luz natural, espejos amplios y sillones cómodos. Color, corte y peinado con productos sin sulfatos y marcas profesionales que conocemos de verdad.',
          image_url: GALLERY[0],
        },
        {
          title: 'Zona spa',
          description:
            'Cabina insonorizada para masajes, faciales y rituales de cuello y cuero cabelludo. Ambiente cálido, aromas suaves y toallas térmicas.',
          image_url: GALLERY[5],
        },
        {
          title: 'Productos clean',
          description:
            'Seleccionamos líneas veganas y cruelty-free cuando es posible. Te recomendamos rutina en casa sin venderte lo que no necesitas.',
          image_url: GALLERY[8],
        },
      ],
      foto_equipo: GALLERY[2],
      direccion: 'Calle de Almagro, 28 · 28010 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2017',
      correo: 'hola@bloomatelier.es',
      galeria: GALLERY,
      horario: {
        mon: { open: '10:00', close: '20:00' },
        tue: { open: '10:00', close: '20:00' },
        wed: { open: '10:00', close: '20:00' },
        thu: { open: '10:00', close: '21:00' },
        fri: { open: '10:00', close: '21:00' },
        sat: { open: '10:00', close: '19:00' },
        sun: { closed: true },
      },
      map_lat: 40.4321,
      map_lon: -3.6948,
      services: [
        {
          name: 'Corte y brushing',
          price: 38,
          description:
            'Lavado con champú adaptado a tu cuero cabelludo, corte a medida y secado con brushing. Incluye asesoría de forma y mantenimiento.',
        },
        {
          name: 'Coloración completa',
          price: 72,
          description:
            'Diagnóstico de base, aplicación de color uniforme y mascarilla reparadora. Ideal para cubrir canas o renovar tono.',
        },
        {
          name: 'Balayage / mechas',
          price: 85,
          description:
            'Aclarado progresivo a mano alzada para un efecto natural. Incluye tono final y tratamiento post-color.',
        },
        {
          name: 'Tratamiento hidratación',
          price: 45,
          description:
            'Mascarilla intensiva, vapor suave y masaje capilar. Recupera brillo en cabellos secos, teñidos o con exceso de calor.',
        },
        {
          name: 'Peinado de evento',
          price: 55,
          description:
            'Recogidos, ondas o semi recogido para boda, comuniones o cenas. Prueba opcional con cita previa.',
        },
        {
          name: 'Manicura semipermanente',
          price: 28,
          description:
            'Preparación de uña, esmaltado de larga duración y aceite de cutículas. Duración aproximada 45 minutos.',
        },
        {
          name: 'Pedicura spa',
          price: 35,
          description:
            'Baño aromático, exfoliación, limado y esmaltado. Opción sin esmalte solo cuidado.',
        },
        {
          name: 'Masaje relajante 60\'',
          price: 58,
          description:
            'Presión media, aceites neutros y cabina privada. Enfocado en espalda, cervicales y piernas.',
        },
        {
          name: 'Facial hidratante',
          price: 52,
          description:
            'Limpieza, exfoliación suave, masaje facial y mascarilla calmante. Para pieles deshidratadas o sensibles.',
        },
        {
          name: 'Ritual cabeza y cuello',
          price: 42,
          description:
            'Masaje en cuero cabelludo, sienes y nuca con aceites esenciales. Alivia tensión acumulada en 30 minutos.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.4321,-3.6948',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/bloom-atelier.vcf',
      is_pro: true,
      subdomain: 'bloom-atelier-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
