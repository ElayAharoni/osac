/**
 * flow: welcome-and-role-selection
 * step: wrs_welcome_landing
 */
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  Title,
} from '@patternfly/react-core'
import type { DemoTenantId, DemoShellRole } from '@osac/api-contracts'
import { DEMO_TENANT_LABEL } from '@osac/api-contracts'
import { LightDarkToggle } from '@osac/ui-components'
import { useSession } from '../contexts/SessionContext'

interface OrgCardProps {
  tenantId: DemoTenantId
  onUser: () => void
  onAdmin: () => void
}

function OrgCard({ tenantId, onUser, onAdmin }: OrgCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{DEMO_TENANT_LABEL[tenantId]}</CardTitle>
      </CardHeader>
      <CardBody>
        <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
          User opens the VM-as-a-Service workspace. Admin opens tenant administration for this
          organization.
        </Content>
      </CardBody>
      <CardFooter>
        <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--sm)' }}>
          <Button variant="secondary" size="sm" onClick={onUser}>
            User
          </Button>
          <Button variant="secondary" size="sm" onClick={onAdmin}>
            Admin
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { selectProviderAdmin, openTenantInNewTab, isDarkTheme, setIsDarkTheme } = useSession()

  function handleProviderAdmin() {
    selectProviderAdmin()
    navigate('/sign-in')
  }

  function handleTenantEntry(tenant: DemoTenantId, role: DemoShellRole) {
    openTenantInNewTab(tenant, role)
  }

  return (
    <div className="osac-welcome-page">
      {/* Theme toggle (top right) */}
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <LightDarkToggle isDark={isDarkTheme} onChange={setIsDarkTheme} aria-label="Toggle theme" />
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <Title headingLevel="h1" size="3xl" style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
          Welcome to OSAC
        </Title>
        <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
          Choose the provider console or an organization, then sign in as a user or admin.
        </Content>
      </div>

      {/* Demo alert */}
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <Alert
          variant="info"
          isInline
          title="Demo entry — not a customer sign-in page"
        >
          <Content component="p">
            This screen is for booth operators to pick a persona. In production, end users open their
            organization-branded URL and sign in through the identity provider configured during
            onboarding.
          </Content>
          <Content component="p" style={{ marginTop: 'var(--pf-t--global--spacer--xs)' }}>
            Each organization card below simulates a separate tenant so you can show multi-tenant
            isolation in the VM workspace.
          </Content>
        </Alert>
      </div>

      {/* Card grid */}
      <div className="osac-welcome-card-grid">
        {/* Provider Admin */}
        <Card isFullHeight>
          <CardHeader>
            <CardTitle>Provider Admin</CardTitle>
          </CardHeader>
          <CardBody>
            <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              Manage platform services, tenants, and global policies for the OSAC environment.
            </Content>
          </CardBody>
          <CardFooter>
            <Button variant="primary" onClick={handleProviderAdmin}>
              Enter
            </Button>
          </CardFooter>
        </Card>

        {/* Northstar Bank */}
        <OrgCard
          tenantId="northstar"
          onUser={() => handleTenantEntry('northstar', 'tenantUser')}
          onAdmin={() => handleTenantEntry('northstar', 'tenantAdmin')}
        />

        {/* Bluestone Financial Group (tenant id: evergreen) */}
        <OrgCard
          tenantId="evergreen"
          onUser={() => handleTenantEntry('evergreen', 'tenantUser')}
          onAdmin={() => handleTenantEntry('evergreen', 'tenantAdmin')}
        />
      </div>
    </div>
  )
}
