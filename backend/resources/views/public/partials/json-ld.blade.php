{{-- ═══════════════════════════════════════════════════════════════════
     JSON-LD — Datos estructurados Schema.org LocalBusiness
     Variable esperada: $jsonLd (string JSON ya serializado)
     ═══════════════════════════════════════════════════════════════════ --}}
@if(!empty($jsonLd))
<script type="application/ld+json">
{!! $jsonLd !!}
</script>
@endif
