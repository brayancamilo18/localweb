import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Field, Input, Textarea } from '../../../components/primitives/primitives'
import Select from '../../../components/primitives/Select'
import { useToast } from '../../../components/ui/Toast'
import { getTemplates, updateBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'

export default function Editor() {
  const { business, refetch } = useDashboard()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState(business.name)
  const [tagline, setTagline] = useState(business.tagline ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [templateId, setTemplateId] = useState(String(business.template.id))

  useEffect(() => {
    setName(business.name)
    setTagline(business.tagline ?? '')
    setDescription(business.description ?? '')
    setPhone(business.phone ?? '')
    setAddress(business.address ?? '')
    setTemplateId(String(business.template.id))
  }, [business])

  const templatesQ = useQuery({
    queryKey: keys.dashboard.templates,
    queryFn: getTemplates,
  })

  const mutation = useMutation({
    mutationFn: () =>
      updateBusiness({
        name: name.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        template_id: Number(templateId),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      refetch()
      showToast({
        type: 'success',
        title: 'Cambios guardados',
        description: 'El contenido público se ha actualizado.',
      })
    },
    onError: () => {
      // `mutation.mutate()` no toma argumentos: la mutación lee los inputs del state
      // local, así que reintentar = volver a llamar a `mutate()` con los mismos valores
      // todavía visibles en el formulario.
      showToast({
        type: 'error',
        title: 'No se pudo guardar',
        description: 'Revisa tu conexión y vuelve a intentarlo.',
        action: { label: 'Reintentar', onClick: () => mutation.mutate() },
      })
    },
  })

  const templateOptions =
    templatesQ.data?.map((t) => ({ value: String(t.id), label: t.name })) ?? [
      { value: String(business.template.id), label: business.template.name },
    ]

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Editar contenido
      </h1>
      <p className="lw-small" style={{ marginBottom: 24, fontSize: 13 }}>
        Nombre, tagline, descripción y plantilla de tu página pública.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Nombre del negocio">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tagline" optional>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>
        <Field label="Descripción" optional>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>
        <Field label="Teléfono" optional>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Dirección" optional>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Select
          label="Plantilla"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={templateOptions}
          disabled={templatesQ.isLoading}
        />
        <Btn kind="primary" type="button" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Guardar cambios
        </Btn>
      </div>
    </div>
  )
}
