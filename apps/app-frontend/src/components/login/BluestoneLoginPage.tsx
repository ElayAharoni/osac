/**
 * Bluestone Financial Group branded login page.
 * Light theme, clean corporate styling.
 */
import { Card, CardBody, CardHeader, CardTitle, Content, Title } from '@patternfly/react-core'
import { LoginForm } from './LoginForm'
import { useSession } from '../../contexts/SessionContext'

interface Props {
  defaultEmail: string
  onLoginSuccess: () => void
  onChooseAnother: () => void
}

export function BluestoneLoginPage({ defaultEmail, onLoginSuccess, onChooseAnother }: Props) {
  const { isLoginLoading } = useSession()

  return (
    <div
      className="osac-login-page"
      style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)',
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
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              B
            </div>
            <Title headingLevel="h1" size="xl" style={{ color: '#0d47a1', margin: 0 }}>
              Bluestone Financial Group
            </Title>
          </div>
          <Content component="p" style={{ color: '#546e7a', margin: 0 }}>
            Secure access to your financial workspace
          </Content>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardBody>
            <LoginForm
              defaultEmail={defaultEmail}
              emailLabel="Email address"
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
