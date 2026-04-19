/**
 * flow: recent-activities
 * step: ra_activity_feed
 */
import { useMemo } from 'react'
import {
  Content,
  Label,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { buildRecentActivities } from '@osac/api-contracts'
import { useComputeInstances } from '../api/hooks'

const SEVERITY_COLOR: Record<string, 'green' | 'orange' | 'red' | 'blue' | 'grey'> = {
  success: 'green',
  warning: 'orange',
  danger: 'red',
  info: 'blue',
}

export function RecentActivitiesPage() {
  const { data: vms = [] } = useComputeInstances()
  const activities = useMemo(() => buildRecentActivities(vms, 30), [vms])

  return (
    <PageSection>
      <div style={{ maxWidth: '800px' }}>
        <Title headingLevel="h1" size="2xl" style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
          Recent activities
        </Title>

        {activities.length === 0 ? (
          <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
            No recent activities to display.
          </Content>
        ) : (
          <div className="osac-activity-list">
            {activities.map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--pf-t--global--spacer--md)',
                  padding: 'var(--pf-t--global--spacer--md)',
                  border: '1px solid var(--pf-t--global--border--color--default)',
                  borderRadius: 'var(--pf-t--global--border--radius--medium)',
                  background: 'var(--pf-t--global--background--color--secondary--default)',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <Label
                    color={SEVERITY_COLOR[event.severity ?? 'info'] ?? 'blue'}
                    isCompact
                    variant="outline"
                  >
                    {event.type}
                  </Label>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Content
                    component="p"
                    style={{
                      margin: 0,
                      fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                    }}
                  >
                    {event.message ?? event.type}
                  </Content>
                  {event.relatedObjectRefs && event.relatedObjectRefs.length > 0 && (
                    <Content
                      component="small"
                      style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
                    >
                      {event.relatedObjectRefs.map((r) => r.name ?? r.id).join(', ')}
                    </Content>
                  )}
                </div>
                <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  <Content
                    component="small"
                    style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
                  >
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' '}
                    {new Date(event.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Content>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageSection>
  )
}
