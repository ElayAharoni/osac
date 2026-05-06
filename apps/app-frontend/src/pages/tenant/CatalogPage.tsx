/**
 * flow: vm-template-catalog
 * steps: vmc_catalog_grid, vmc_catalog_provider_global
 */
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  Flex,
  Gallery,
  GalleryItem,
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
import { useSession } from '../../contexts/SessionContext'
import { useClusterTemplates, useComputeInstances } from '../../api/hooks'
import { PageHeader } from '../../components/layout'
import type { CreateVmWizardHandle } from '../../components/vm/CreateVmWizard'
import { CreateVmWizard } from '../../components/vm/CreateVmWizard'
import { TemplateCard } from '../../components/vm/TemplateCard'

interface Props {
  isProviderGlobal?: boolean
}

export function CatalogPage({ isProviderGlobal = false }: Props) {
  const queryClient = useQueryClient()
  const { selectedTenant } = useSession()
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ClusterTemplate | null>(null)
  const wizardRef = useRef<CreateVmWizardHandle>(null)

  const { data: templates = [] } = useClusterTemplates()
  const { data: vms = [] } = useComputeInstances()

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
        onProvision={(_vm) => {
          void queryClient.invalidateQueries({ queryKey: ['compute_instances'] })
        }}
        defaultMode="template"
      />

      <PageHeader
        title={isProviderGlobal ? 'Global templates' : 'Templates'}
        description={
          isProviderGlobal
            ? 'Provider-wide template gallery available to all tenant organizations.'
            : 'Browse VM templates and start a virtual machine from a pre-configured image.'
        }
        actions={
          <SearchInput
            placeholder="Search templates…"
            value={search}
            onChange={(_e, v) => setSearch(v)}
            onClear={() => setSearch('')}
            style={{ minWidth: 240 }}
          />
        }
      />

      {isProvisionBlocked && (
        <Flex style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <Label color="orange" isCompact>
            Provisioning is restricted for the Vertexa provider context in this demo.
          </Label>
        </Flex>
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
                          <Flex
                            flexWrap={{ default: 'wrap' }}
                            spaceItems={{ default: 'spaceItemsXs' }}
                          >
                            {selectedTemplate.tags.map((tag) => (
                              <Label key={tag} isCompact color="blue" variant="outline">
                                {tag}
                              </Label>
                            ))}
                          </Flex>
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
                  <Flex style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
                    <Button
                      variant="primary"
                      isDisabled={isProvisionBlocked}
                      onClick={() => handleOpenFromTemplate(selectedTemplate)}
                    >
                      Create VM from template
                    </Button>
                  </Flex>
                </DrawerPanelBody>
              </DrawerPanelContent>
            ) : undefined
          }
        >
          <DrawerContentBody>
            {filtered.length === 0 ? (
              <Content
                component="p"
                style={{
                  color: 'var(--pf-t--global--text--color--subtle)',
                  padding: 'var(--pf-t--global--spacer--xl) 0',
                }}
              >
                No templates match your search.
              </Content>
            ) : (
              <Gallery
                hasGutter
                className="osac-template-gallery"
                style={{ padding: 'var(--pf-t--global--spacer--md) 0' }}
              >
                {filtered.map((tpl) => (
                  <GalleryItem key={tpl.id}>
                    <TemplateCard
                      template={tpl}
                      isSelected={selectedTemplate?.id === tpl.id}
                      isProvisionBlocked={isProvisionBlocked}
                      onClick={() =>
                        setSelectedTemplate((prev) => (prev?.id === tpl.id ? null : tpl))
                      }
                      onCreateFromTemplate={() => handleOpenFromTemplate(tpl)}
                    />
                  </GalleryItem>
                ))}
              </Gallery>
            )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </PageSection>
  )
}
