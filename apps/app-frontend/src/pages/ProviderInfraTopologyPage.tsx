/**
 * flow: provider-administration
 * step: pad_infrastructure_topology
 */
import { Content, PageSection, Title } from '@patternfly/react-core'
import { NetworkTopologyPage } from '@osac/ui-components'
import { useComputeInstances } from '../api/hooks'

export function ProviderInfraTopologyPage() {
  const { data: vms = [] } = useComputeInstances()

  return (
    <PageSection isFilled>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Infrastructure
          </Title>
          <Content component="p" style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
            Platform-wide network topology across all tenant organizations.
          </Content>
        </div>
      </div>
      {/* Provider topology — VM node click is no-op per spec */}
      <NetworkTopologyPage vms={vms} />
    </PageSection>
  )
}
