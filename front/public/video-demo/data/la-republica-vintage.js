/**
 * Demo Sanguchería La República — La República Vintage (temporal, solo grabación).
 * Sánguches peruanos · Lavapiés, Madrid.
 * Fotos coherentes: sándwiches, barra y cocina caliente.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Hero — tres fotos del mismo local (URLs verificadas HTTP 200). */
  var HERO_1 = U('photo-1568901346375-23c9450c58cd', 1200);
  var HERO_2 = U('photo-1550547660-d9450f859349', 1000);
  var HERO_3 = U('photo-1555396273-367ea4eb4db5', 1000);

  /** 6 fotos — máximo de la plantilla; mismo universo sanguchería. */
  var GALLERY = [
    U('photo-1568901346375-23c9450c58cd', 900),
    U('photo-1551782450-17144efb9c50', 900),
    U('photo-1550547660-d9450f859349', 900),
    U('photo-1551782450-a2132b4ba21d', 900),
    U('photo-1555939594-58d7cb561ad1', 900),
    U('photo-1546069901-ba9599a7e63c', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'la-republica-vintage',
    title: 'Sanguchería La República',
    subtitle: 'La República Vintage · Sánguches peruanos · Lavapiés, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Sanguchería La República',
      tagline: 'Sánguches peruanos · Lavapiés, Madrid',
      telefono: '+34915342109',
      whatsapp: '34915342109',
      portada: HERO_1,
      portada_2: HERO_2,
      portada_3: HERO_3,
      descripcion:
        'La República es una sanguchería peruana de barrio: pan crujiente, salsas caseras y recetas de Lima en formato sánguche generoso. Chicharrón crocante, butifarra con salsa criolla, triple limeño y pollo a la brasa en pan de campo. Cocina abierta, cola rápida al mediodía y mesas altas para comer de pie como en el mercado. Todo hecho al momento; nada precocinado en frituras ni salsas.',
      about_title: 'Sabor limeño, pan de Madrid',
      about_sections: [
        {
          title: 'La sanguchería',
          description:
            'Local pequeño de azulejos y fotos vintage del Perú. Olor a ají amarillo desde la puerta y bandeja de cebolla encurtida siempre llena.',
          image_url: GALLERY[5],
        },
        {
          title: 'El pan de la casa',
          description:
            'Pan peruano horneado cada mañana: corteza fina, miga suave. Aguanta salsas y jugos sin deshacerse a la primera mordida.',
          image_url: GALLERY[2],
        },
      ],
      foto_equipo: GALLERY[4],
      direccion: 'Calle de la Cava Baja, 12 · 28005 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2019',
      correo: 'hola@sangucherialarepublica.es',
      galeria: GALLERY,
      horario: {
        mon: { closed: true },
        tue: { open: '12:00', close: '22:00' },
        wed: { open: '12:00', close: '22:00' },
        thu: { open: '12:00', close: '22:00' },
        fri: { open: '12:00', close: '23:00' },
        sat: { open: '12:00', close: '23:00' },
        sun: { open: '12:00', close: '17:00' },
      },
      map_lat: 40.4138,
      map_lon: -3.7087,
      services: [
        {
          name: 'Sánguche de chicharrón',
          price: 8.5,
          description:
            'Chicharrón crocante, camote frito, salsa criolla y ají amarillo en pan peruano. El más pedido del local.',
        },
        {
          name: 'Butifarra clásica',
          price: 7.5,
          description:
            'Jamón del país, lechuga, tomate, salsa criolla y mayonesa casera. Receta limeña de mercado.',
        },
        {
          name: 'Pan con pejerrey',
          price: 9,
          description:
            'Pejerrey frito en tempura ligera, limón, ají y cebolla encurtida. Disponible viernes y sábado.',
        },
        {
          name: 'Triple limeño',
          price: 8,
          description:
            'Capas de pollo, jamón y huevo con palta, tomate y mayonesa. Contundente y equilibrado.',
        },
        {
          name: 'Pollo a la brasa',
          price: 8.5,
          description:
            'Pollo marinado 24 h, lechuga, papas fritas dentro del pan y salsa huacatay opcional.',
        },
        {
          name: 'Pan con lechón',
          price: 9.5,
          description:
            'Lechón confitado, cebolla encurtida y salsa de menta. Solo fines de semana, hasta agotar.',
        },
        {
          name: 'Sánguche de lomo',
          price: 10,
          description:
            'Lomo salteado con tomate, cebolla y ají, montado caliente en pan recién tostado.',
        },
        {
          name: 'Desayuno peruano',
          price: 6.5,
          description:
            'Pan con tamal, huevo frito y café pasado. De martes a viernes hasta las 12:00.',
        },
        {
          name: 'Papas a la huancaína',
          price: 4.5,
          description:
            'Ración generosa con salsa huancaína casera, huevo duro y aceituna. Para compartir o acompañar.',
        },
        {
          name: 'Chicha morada casera',
          price: 2.5,
          description:
            'Jarra fría de maíz morado, piña y especias. Sin gas ni conservantes.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.4138,-3.7087',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/sangucheria-la-republica.vcf',
      is_pro: true,
      subdomain: 'sangucheria-la-republica-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
