/**
 * flow: tenant-administration
 * step: tad_users
 */
import {
  Button,
  Content,
  Label,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { NORTHSTAR_USERS, EVERGREEN_USERS } from '@osac/api-contracts'
import { useSession } from '../contexts/SessionContext'

export function AdminUsersPage() {
  const { selectedTenant } = useSession()
  const users = selectedTenant === 'northstar' ? NORTHSTAR_USERS : EVERGREEN_USERS

  return (
    <PageSection>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Users
          </Title>
          <Content component="p" style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
            Manage users and access for your organization.
          </Content>
        </div>
        <Button variant="primary" onClick={() => {/* stub */}}>
          Add user
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--pf-t--global--font--size--body--default)',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--pf-t--global--border--color--default)' }}>
              {['Name', 'Email', 'Role', 'Status', 'Last login'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 'var(--pf-t--global--spacer--sm)',
                    textAlign: 'left',
                    fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                    color: 'var(--pf-t--global--text--color--subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}
              >
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)', fontWeight: 600 }}>
                  {user.name}
                </td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>{user.email}</td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>
                  <Label
                    color={user.role === 'tenantAdmin' ? 'purple' : 'blue'}
                    isCompact
                    variant="outline"
                  >
                    {user.role === 'tenantAdmin' ? 'Admin' : 'User'}
                  </Label>
                </td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>
                  <Label
                    color={user.status === 'active' ? 'green' : 'grey'}
                    isCompact
                  >
                    {user.status}
                  </Label>
                </td>
                <td
                  style={{
                    padding: 'var(--pf-t--global--spacer--sm)',
                    color: 'var(--pf-t--global--text--color--subtle)',
                  }}
                >
                  {user.lastLogin ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  )
}
