/**
 * Northstar Bank branded login page.
 * Dark theme, bank branding with star motif.
 */
import { Card, CardBody, CardHeader, CardTitle, Content, Title } from '@patternfly/react-core'
import { LoginForm } from './LoginForm'
import { useSession } from '../../contexts/SessionContext'

interface Props {
  defaultEmail: string
  onLoginSuccess: () => void
  onChooseAnother: () => void
}

export function NorthstarLoginPage({ defaultEmail, onLoginSuccess, onChooseAnother }: Props) {
  const { isLoginLoading } = useSession()

  return (
    <div
      className="osac-login-page"
      style={{
        background: 'linear-gradient(180deg, #001f4d 0%, #003380 100%)',
      }}
    >
      <div className="osac-login-card">
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--pf-t--global--spacer--xl)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--pf-t--global--spacer--sm)',
              marginBottom: 'var(--pf-t--global--spacer--md)',
            }}
          >
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>⭐</span>
            <Title headingLevel="h1" size="xl" style={{ color: '#fff', margin: 0 }}>
              Northstar Bank
            </Title>
          </div>
          <Content component="p" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Smart banking starts here.
          </Content>
        </div>

        <Card
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: '#fff' }}>Online banking sign-in</CardTitle>
          </CardHeader>
          <CardBody>
            <LoginForm
              defaultEmail={defaultEmail}
              emailLabel="Username or email"
              emailType="email"
              showRememberMe
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
