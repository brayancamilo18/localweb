/**
 * Demo Hotel Cala Serena — Coastal Calm (temporal, solo grabación de vídeo).
 * Hotel boutique · playa, Valencia.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Hotel frente al mar — hero (URL verificada HTTP 200). */
  var HERO = U('photo-1542314831-068cd1dbfeeb', 1400);

  /** 10 fotos hotel — todas comprobadas. */
  var GALLERY = [
    U('photo-1566073771259-6a8506099945', 900),
    U('photo-1571896349842-33c89424de2d', 900),
    U('photo-1582719478250-c89cae4dc85b', 900),
    U('photo-1611892440504-42a792e24d32', 900),
    U('photo-1631049307264-da0ec9d70304', 900),
    U('photo-1551882547-ff40c63fe5fa', 900),
    U('photo-1522771739844-6a9f6d5f14af', 900),
    U('photo-1571003123894-1f0594d2b5d9', 900),
    U('photo-1505693416388-ac5ce068fe85', 900),
    U('photo-1499793983690-e29da59ef1c2', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'coastal-calm',
    title: 'Hotel Cala Serena',
    subtitle: 'Coastal Calm · Hotel boutique · Valencia',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Hotel Cala Serena',
      tagline: 'Hotel boutique · Playa de las Arenas, Valencia',
      telefono: '+34961234567',
      whatsapp: '34961234567',
      portada: HERO,
      portada_2: '',
      portada_3: '',
      descripcion:
        'Hotel Cala Serena es un refugio de calma a pocos pasos del Mediterráneo. Veintiocho habitaciones con luz natural, textiles de lino y baños amplios. Desayuno con producto local, terraza para las puestas de sol y spa con circuito de aguas. Ideal para escapadas en pareja, teletrabajo con vistas o un fin de semana sin prisas. Check-in flexible y equipo de recepción las 24 horas.',
      about_title: 'Donde el mar marca el ritmo',
      about_sections: [
        {
          title: 'El hotel',
          description:
            'Edificio bajo de líneas blancas y madera clara. Piscina en la azotea, salón de lectura y jardín interior donde desayunar al aire libre casi todo el año.',
          image_url: GALLERY[0],
        },
        {
          title: 'Habitaciones',
          description:
            'Doble, superior y suite junior con terraza. Aire acondicionado silencioso, minibar selecto, caja fuerte y Wi‑Fi de fibra en todo el hotel.',
          image_url: GALLERY[3],
        },
        {
          title: 'Gastronomía',
          description:
            'Restaurante de cocina mediterránea en planta baja. Pescado del día, arroces y carta de vinos de la Comunitat. Servicio en terraza hasta las 23:00 en verano.',
          image_url: GALLERY[5],
        },
      ],
      foto_equipo: GALLERY[5],
      direccion: 'Paseo Neptuno, 34 · 46011 Valencia',
      ciudad: 'Valencia',
      pais: 'España',
      anio_fundacion: '2015',
      correo: 'reservas@calaserena.es',
      galeria: GALLERY,
      horario: {
        mon: { open: '00:00', close: '23:59' },
        tue: { open: '00:00', close: '23:59' },
        wed: { open: '00:00', close: '23:59' },
        thu: { open: '00:00', close: '23:59' },
        fri: { open: '00:00', close: '23:59' },
        sat: { open: '00:00', close: '23:59' },
        sun: { open: '00:00', close: '23:59' },
      },
      map_lat: 39.4582,
      map_lon: -0.3248,
      services: [
        {
          name: 'Habitación doble con vistas',
          price: 145,
          description:
            'Cama queen, baño con ducha efecto lluvia y vistas parciales al mar. Desayuno no incluido. Cancelación flexible 48 h antes.',
        },
        {
          name: 'Suite junior con terraza',
          price: 195,
          description:
            'Salón independiente, terraza privada y amenities de autor. Ideal para aniversarios o estancias largas.',
        },
        {
          name: 'Desayuno buffet mediterráneo',
          price: 18,
          description:
            'Pan recién horneado, fruta de temporada, huevos a la plancha, zumos naturales y café de especialidad. De 7:30 a 11:00.',
        },
        {
          name: 'Media pensión',
          price: 45,
          description:
            'Desayuno buffet y cena de tres platos en restaurante (bebida no incluida). Menú cambiante según mercado.',
        },
        {
          name: 'Spa & circuito termal',
          price: 35,
          description:
            'Sauna, baño turco y piscina de contrastes. Acceso 90 minutos. Toalla y agua incluidas. Reserva previa.',
        },
        {
          name: 'Masaje en pareja 60\'',
          price: 120,
          description:
            'Dos camillas en cabina doble, aceites neutros y presión media. Ritual relajante para dos personas.',
        },
        {
          name: 'Parking privado 24 h',
          price: 15,
          description:
            'Plaza cubierta con acceso directo al ascensor. Sujeto a disponibilidad; conviene reservar al hacer el check-in.',
        },
        {
          name: 'Late check-out',
          price: 25,
          description:
            'Salida extendida hasta las 14:00 en lugar de las 12:00. Según disponibilidad del día de salida.',
        },
        {
          name: 'Cena maridaje en terraza',
          price: 58,
          description:
            'Menú degustación de cinco pases con maridaje de vinos locales. Solo temporada alta, de jueves a sábado.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=39.4582,-0.3248',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/cala-serena.vcf',
      is_pro: true,
      subdomain: 'cala-serena-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
