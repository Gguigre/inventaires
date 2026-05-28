const EMAIL_DOMAIN = 'inventaires.gremillet-moghaddam.fr'

export function toEmailSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'association'
  )
}

export function fromAddress(associationName: string): string {
  return `${associationName} <${toEmailSlug(associationName)}@${EMAIL_DOMAIN}>`
}
