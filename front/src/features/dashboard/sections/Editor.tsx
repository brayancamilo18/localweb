import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Field, Input, Textarea } from '../../../components/primitives/primitives'
import Select from '../../../components/primitives/Select'
import { useToast } from '../../../components/ui/Toast'
import { CharCounter } from '../../../components/ui/CharCounter'
import { getTemplates, updateBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'

/** Límites duros del backend (`StepController`/`BusinessController` validan con
 * `max:120` y `max:500`). Si cambian allí, deben cambiar aquí para que el
 * counter visual coincida con la validación del servidor. */
const TAGLINE_MAX = 120
const DESCRIPTION_MAX = 500

export default function Editor() {
  const { business, refetch } = useDashboard()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState(business.name)
  const [tagline, setTagline] = useState(business.tagline ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [email, setEmail] = useState(business.email ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [templateId, setTemplateId] = useState(String(business.template.id))

  useEffect(() => {
    setName(business.name)
    setTagline(business.tagline ?? '')
    setDescription(business.description ?? '')
    setPhone(business.phone ?? '')
    setEmail(business.email ?? '')
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
        email: email.trim() || null,
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
        <Field
          label="Tagline"
          optional
          counter={
            <CharCounter
              value={tagline.length}
              max={TAGLINE_MAX}
              ariaLabel={`Tagline: ${tagline.length} de ${TAGLINE_MAX} caracteres`}
            />
          }
        >
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={TAGLINE_MAX}
          />
        </Field>
        <Field
          label="Descripción"
          optional
          counter={
            <CharCounter
              value={description.length}
              max={DESCRIPTION_MAX}
              ariaLabel={`Descripción: ${description.length} de ${DESCRIPTION_MAX} caracteres`}
            />
          }
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={DESCRIPTION_MAX}
          />
        </Field>
        <Field label="Teléfono" optional>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field
          label="Email de contacto"
          optional
          hint="Email público que se mostrará en el footer y en la sección de contacto. Puede ser distinto al email con el que inicias sesión."
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@tu-negocio.com"
            maxLength={191}
          />
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
