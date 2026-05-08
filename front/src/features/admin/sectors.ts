/** Alineado con `backend/config/sectors.php` */
export const ADMIN_SECTOR_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los sectores' },
  { value: 'peluqueria', label: 'Peluquería' },
  { value: 'barberia', label: 'Barbería' },
  { value: 'estetica', label: 'Estética' },
  { value: 'spa', label: 'Spa' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'bar', label: 'Bar' },
  { value: 'panaderia', label: 'Panadería' },
  { value: 'tienda_ropa', label: 'Tienda ropa' },
  { value: 'tienda_calzado', label: 'Tienda calzado' },
  { value: 'floristeria', label: 'Floristería' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'clinica_dental', label: 'Clínica dental' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'academia', label: 'Academia' },
  { value: 'fontanero', label: 'Fontanero' },
  { value: 'electricista', label: 'Electricista' },
  { value: 'cerrajero', label: 'Cerrajero' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'taller_mecanico', label: 'Taller mecánico' },
  { value: 'otros', label: 'Otros' },
]

/** Opciones para formularios (sin entrada vacía). */
export const ADMIN_SECTOR_FORM_OPTIONS = ADMIN_SECTOR_OPTIONS.filter((o) => o.value !== '')
