/**
 * Vertexa Cloud Solutions branded login page.
 * Dark theme, provider admin persona.
 */
import { Card, CardBody, CardHeader, CardTitle, Content, Title } from '@patternfly/react-core'
import { LoginForm } from './LoginForm'
import { useSession } from '../../contexts/SessionContext'

interface Props {
  defaultEmail: string
  onLoginSuccess: () => void
  onChooseAnother: () => void
}

export function VertexaLoginPage({ defaultEmail, onLoginSuccess, onChooseAnother }: Props) {
  const { isLoginLoading } = useSession()

  return (
    <div
      className="osac-login-page"
      style={{
        background: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)',
      }}
    >
      <div className="osac-login-card">
        {/* Brand header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--pf-t--global--spacer--xl)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--pf-t--global--spacer--sm)',
              marginBottom: 'var(--pf-t--global--spacer--md)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              V
            </div>
            <Title headingLevel="h1" size="xl" style={{ color: '#fff', margin: 0 }}>
              Vertexa Cloud Solutions
            </Title>
          </div>
          <Content component="p" style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Provider platform portal
          </Content>
        </div>

        <Card style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardHeader>
            <CardTitle style={{ color: '#fff' }}>Sign in to your account</CardTitle>
          </CardHeader>
          <CardBody>
            <LoginForm
              defaultEmail={defaultEmail}
              emailLabel="Work email"
              emailType="email"
              isLoading={isLoginLoading}
              onSubmit={onLoginSuccess}
              onChooseAnother={onChooseAnother}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
