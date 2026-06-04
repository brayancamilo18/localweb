/**
 * Demo Calle 14 Barber — Urban Bold (temporal, solo grabación de vídeo).
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Barbero trabajando — hero (URLs verificadas HTTP 200). */
  var HERO = U('photo-1502823403499-6ccfcf4fb453', 1400);

  /** 10 fotos de barbería — todas comprobadas, sin rotas. */
  var GALLERY = [
    U('photo-1621605815971-fbc98d665033', 900),
    U('photo-1560066984-138dadb4c035', 900),
    U('photo-1522337360788-8b13dee7a37e', 900),
    U('photo-1492106087820-71f1a00d2b11', 900),
    U('photo-1521590832167-7bcbfaa6381f', 900),
    U('photo-1605497788044-5a32c7078486', 900),
    U('photo-1599351431202-1e0f0137899a', 900),
    U('photo-1516975080664-ed2fc6a32937', 900),
    U('photo-1487412947147-5cebf100ffc2', 900),
    U('photo-1502823403499-6ccfcf4fb453', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'urban-bold',
    title: 'Calle 14 Barber',
    subtitle: 'Urban Bold · Barbería · Malasaña, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Calle 14 Barber',
      tagline: 'Barbería · Malasaña, Madrid',
      telefono: '+34914005566',
      whatsapp: '34914005566',
      portada: HERO,
      portada_2: '',
      portada_3: '',
      descripcion:
        'Somos una barbería de barrio en pleno Malasaña. Llevamos desde 2016 cortando, perfilando y cuidando barbas con calma y oficio. No vendemos humo: entras, te sientas, te miramos y te proponemos lo que mejor te queda. Fades limpios, clásicos bien hechos y afeitados a navaja cuando toca. Walk-in algunos días; cita previa si quieres asegurar tu hueco.',
      about_title: 'Barberos de barrio desde 2016',
      about_sections: [
        {
          title: 'La barbería',
          description:
            'Local pequeño, luz natural y espejos grandes. Música baja, conversación fácil. Aquí no hay prisas: cada corte lleva su tiempo.',
          image_url: GALLERY[0],
        },
        {
          title: 'El equipo',
          description:
            'Tres barberos, mismo criterio. Formación continua en fades, texturizados y barba. Si no sabes qué pedir, te orientamos sin rollos.',
          image_url: GALLERY[4],
        },
        {
          title: 'Productos',
          description:
            'Cera, pomada, aceite de barba y aftershave de marcas que usamos a diario. Te los enseñamos en la silla y los tienes en mostrador.',
          image_url: GALLERY[6],
        },
      ],
      foto_equipo: GALLERY[2],
      direccion: 'Calle del Pez, 14 · 28004 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2016',
      correo: 'hola@calle14barber.es',
      galeria: GALLERY,
      horario: {
        mon: { open: '10:00', close: '20:00' },
        tue: { open: '10:00', close: '20:00' },
        wed: { open: '10:00', close: '20:00' },
        thu: { open: '10:00', close: '21:00' },
        fri: { open: '10:00', close: '21:00' },
        sat: { open: '10:00', close: '18:00' },
        sun: { closed: true },
      },
      map_lat: 40.4262,
      map_lon: -3.7045,
      services: [
        {
          name: 'Corte fade',
          price: 22,
          description:
            'Degradado limpio desde cero hasta la altura que elijas. Contornos a máquina, tijera arriba y acabado con navaja en nuca y patillas.',
        },
        {
          name: 'Corte clásico',
          price: 20,
          description:
            'Tijera y máquina, estilo atemporal. Peine, simetría y secado básico. Para quien quiere ir bien peinado sin complicarse.',
        },
        {
          name: 'Corte + barba',
          price: 28,
          description:
            'Corte completo y arreglo de barba en la misma visita. Perfilado, longitud uniforme y aceite si la llevas seca.',
        },
        {
          name: 'Arreglo de barba',
          price: 14,
          description:
            'Perfilado con navaja, contorno de mejillas y cuello. Ideal entre visitas si llevas barba larga o de tres días.',
        },
        {
          name: 'Afeitado clásico',
          price: 18,
          description:
            'Toalla caliente, espuma, navaja y aftershave. Cuello y mejillas al ras. Para eventos o cuando apetece el ritual completo.',
        },
        {
          name: 'Degradado + diseño',
          price: 26,
          description:
            'Fade con línea o dibujo discreto en contorno. Requiere cita; traemos referencia o te proponemos algo que encaje con tu rostro.',
        },
        {
          name: 'Color de barba',
          price: 15,
          description:
            'Camuflaje de canas en barba y bigote. Tono natural, sin efecto “pintado”. Duración aproximada 20 minutos.',
        },
        {
          name: 'Tratamiento capilar',
          price: 12,
          description:
            'Champú, mascarilla hidratante y masaje de cuero cabelludo. Para pelo reseco o después de mucho decolorante.',
        },
        {
          name: 'Corte niño (hasta 12 años)',
          price: 16,
          description:
            'Mismo cuidado que un adulto, en menos tiempo. Ambiente tranquilo; si es su primera vez, vamos con paciencia.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.4262,-3.7045',
      google_business_url: 'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/calle14.vcf',
      is_pro: true,
      subdomain: 'calle14-barber-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
