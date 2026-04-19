/**
 * flow: tenant-administration
 * step: tad_networks_topology
 */
import { Content, PageSection, Title } from '@patternfly/react-core'
import { DEMO_TENANT_LABEL } from '@osac/api-contracts'
import { NetworkTopologyPage } from '@osac/ui-components'
import { useSession } from '../contexts/SessionContext'
import { useComputeInstances } from '../api/hooks'

interface Props {
  onOpenVmDetail?: (vmId: string) => void
}

export function AdminNetworksPage({ onOpenVmDetail }: Props) {
  const { selectedTenant } = useSession()
  const { data: vms = [] } = useComputeInstances()
  const tenantLabel = selectedTenant ? DEMO_TENANT_LABEL[selectedTenant] : 'Tenant'

  return (
    <PageSection isFilled>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Networks
          </Title>
          <Content component="p" style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
            Network topology for {tenantLabel}. Click a VM node to open its detail.
          </Content>
        </div>
      </div>
      <NetworkTopologyPage vms={vms} onOpenVirtualMachineDetail={onOpenVmDetail} />
    </PageSection>
  )
}
