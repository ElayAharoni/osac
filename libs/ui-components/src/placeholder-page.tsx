import { Content, Title } from '@patternfly/react-core'

interface PlaceholderPageProps {
  title: string
  lede: string
}

export function PlaceholderPage({ title, lede }: PlaceholderPageProps) {
  return (
    <div style={{ maxWidth: '48rem' }}>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
        {title}
      </Title>
      <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
        {lede}
      </Content>
      <Content
        component="p"
        style={{
          marginTop: 'var(--pf-t--global--spacer--lg)',
          color: 'var(--pf-t--global--text--color--subtle)',
          fontStyle: 'italic',
        }}
      >
        This feature is coming soon. Contact your platform administrator for more information.
      </Content>
    </div>
  )
}
