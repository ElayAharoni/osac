/**
 * flow: vm-template-catalog
 * steps: vmc_catalog_grid, vmc_catalog_provider_global
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Label,
  PageSection,
  SearchInput,
  Title,
} from '@patternfly/react-core'
import type { ClusterTemplate } from '@osac/api-contracts'
import { useSession } from '../contexts/SessionContext'
import { useClusterTemplates, useComputeInstances, useProvisionVm } from '../api/hooks'
import type { CreateVmWizardHandle } from '../components/vm/CreateVmWizard'
import { CreateVmWizard } from '../components/vm/CreateVmWizard'

interface Props {
  isProviderGlobal?: boolean
}

export function CatalogPage({ isProviderGlobal = false }: Props) {
  const { selectedTenant } = useSession()
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ClusterTemplate | null>(null)
  const wizardRef = useRef<CreateVmWizardHandle>(null)

  const { data: templates = [] } = useClusterTemplates()
  const { data: vms = [] } = useComputeInstances()
  const provisionVm = useProvisionVm()

  const isProvisionBlocked = isProviderGlobal && selectedTenant === 'vertexa'
  const tenant = selectedTenant && selectedTenant !== 'vertexa' ? selectedTenant : 'northstar'

  const filtered = useMemo(() => {
    if (!search) return templates
    const q = search.toLowerCase()
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [search, templates])

  const handleOpenFromTemplate = useCallback(
    (tpl: ClusterTemplate) => {
      if (isProvisionBlocked) return
      wizardRef.current?.openFromTemplate(tpl.id)
      setSelectedTemplate(null)
    },
    [isProvisionBlocked],
  )

  return (
    <PageSection isFilled>
      <CreateVmWizard
        ref={wizardRef}
        existingVms={vms}
        tenant={tenant}
        onProvision={(vm) => provisionVm.mutate(vm)}
        defaultMode="template"
      />

      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            {isProviderGlobal ? 'Global templates' : 'Templates'}
          </Title>
          <Content
            component="p"
            style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}
          >
            {isProviderGlobal
              ? 'Provider-wide template gallery available to all tenant organizations.'
              : 'Browse VM templates and start a virtual machine from a pre-configured image.'}
          </Content>
        </div>
        <SearchInput
          placeholder="Search templates…"
          value={search}
          onChange={(_e, v) => setSearch(v)}
          onClear={() => setSearch('')}
          style={{ minWidth: 240 }}
        />
      </div>

      {isProvisionBlocked && (
        <div style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <Label color="orange" isCompact>
            Provisioning is restricted for the Vertexa provider context in this demo.
          </Label>
        </div>
      )}

      <Drawer isExpanded={!!selectedTemplate} isInline>
        <DrawerContent
          panelContent={
            selectedTemplate ? (
              <DrawerPanelContent widths={{ default: 'width_33' }}>
                <DrawerHead>
                  <Title headingLevel="h2" size="xl">
                    {selectedTemplate.title}
                  </Title>
                  <DrawerActions>
                    <DrawerCloseButton onClick={() => setSelectedTemplate(null)} />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody>
                  <Content
                    component="p"
                    style={{
                      color: 'var(--pf-t--global--text--color--subtle)',
                      marginBottom: 'var(--pf-t--global--spacer--md)',
                    }}
                  >
                    {selectedTemplate.description}
                  </Content>
                  <DescriptionList isCompact>
                    {selectedTemplate.workload && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Workload type</DescriptionListTerm>
                        <DescriptionListDescription style={{ textTransform: 'capitalize' }}>
                          {selectedTemplate.workload}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Tags</DescriptionListTerm>
                        <DescriptionListDescription>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pf-t--global--spacer--xs)' }}>
                            {selectedTemplate.tags.map((tag) => (
                              <Label key={tag} isCompact color="blue" variant="outline">
                                {tag}
                              </Label>
                            ))}
                          </div>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last updated</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selectedTemplate.metadata?.createdAt
                          ? new Date(selectedTemplate.metadata.createdAt).toLocaleDateString()
                          : '—'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                  <div style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
                    <Button
                      variant="primary"
                      isDisabled={isProvisionBlocked}
                      onClick={() => handleOpenFromTemplate(selectedTemplate)}
                    >
                      Create VM from template
                    </Button>
                  </div>
                </DrawerPanelBody>
              </DrawerPanelContent>
            ) : undefined
          }
        >
          <DrawerContentBody>
            {filtered.length === 0 ? (
              <Content
                component="p"
                style={{ color: 'var(--pf-t--global--text--color--subtle)', padding: 'var(--pf-t--global--spacer--xl) 0' }}
              >
                No templates match your search.
              </Content>
            ) : (
              <div className="osac-template-gallery" style={{ padding: 'var(--pf-t--global--spacer--md) 0' }}>
                {filtered.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    isSelected={selectedTemplate?.id === tpl.id}
                    isProvisionBlocked={isProvisionBlocked}
                    onClick={() =>
                      setSelectedTemplate((prev) =>
                        prev?.id === tpl.id ? null : tpl,
                      )
                    }
                    onCreateFromTemplate={() => handleOpenFromTemplate(tpl)}
                  />
                ))}
              </div>
            )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </PageSection>
  )
}

function TemplateCard({
  template,
  isSelected,
  isProvisionBlocked,
  onClick,
  onCreateFromTemplate,
}: {
  template: ClusterTemplate
  isSelected: boolean
  isProvisionBlocked: boolean
  onClick: () => void
  onCreateFromTemplate: () => void
}) {
  const iconEmoji =
    template.icon === 'rhel' ? '🐧' : template.icon === 'windows' ? '🪟' : '🐧'

  return (
    <Card
      isClickable={!isSelected}
      isSelected={isSelected}
      isFullHeight
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <CardHeader>
        <CardTitle>
          <span style={{ marginRight: 'var(--pf-t--global--spacer--xs)' }}>{iconEmoji}</span>
          {template.title}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Content
          component="p"
          style={{
            color: 'var(--pf-t--global--text--color--subtle)',
            fontSize: 'var(--pf-t--global--font--size--body--sm)',
          }}
        >
          {(template.description ?? '').slice(0, 100)}
          {(template.description?.length ?? 0) > 100 ? '…' : ''}
        </Content>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--pf-t--global--spacer--xs)',
            marginTop: 'var(--pf-t--global--spacer--sm)',
          }}
        >
          {(template.tags ?? []).slice(0, 3).map((tag) => (
            <Label key={tag} isCompact color="blue" variant="outline">
              {tag}
            </Label>
          ))}
        </div>
      </CardBody>
      <CardFooter>
        <Button
          variant="secondary"
          size="sm"
          isDisabled={isProvisionBlocked}
          onClick={(e) => {
            e.stopPropagation()
            onCreateFromTemplate()
          }}
        >
          Create VM
        </Button>
      </CardFooter>
    </Card>
  )
}
