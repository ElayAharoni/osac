import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  Stack,
  StackItem,
  Switch,
  Tab,
  Tabs,
  TabTitleText,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core'
import { VM_TEMPLATES } from '@osac/api-contracts'
import { useMemo, useState } from 'react'
import type { UpdateFn, WizardState } from '../types'

const PLACEHOLDER_TABS = [
  {
    key: 'storage',
    title: 'Storage',
    body: 'Volumes, disks, and storage classes would be configured here. Not modeled in this demo.',
  },
  {
    key: 'network',
    title: 'Network',
    body: 'Interfaces, networks, and multus attachments would be configured here. Not modeled in this demo.',
  },
  {
    key: 'ssh',
    title: 'SSH',
    body: 'SSH keys and access would be managed here. Not modeled in this demo.',
  },
  {
    key: 'scheduling',
    title: 'Scheduling',
    body: 'Node selectors, tolerations, and affinity would be set here. Not modeled in this demo.',
  },
  {
    key: 'initial-run',
    title: 'Initial run',
    body: 'First-boot scripts and sysprep-style initial run would appear here. Not modeled in this demo.',
  },
  {
    key: 'metadata',
    title: 'Metadata',
    body: 'Labels and annotations for this workload would be edited here. Not modeled in this demo.',
  },
] as const

type CustomizationTabKey = 'overview' | (typeof PLACEHOLDER_TABS)[number]['key']

function PlaceholderTabPanel({ body }: { body: string }) {
  return (
    <Content
      component="p"
      className="pf-v6-u-color-text-subtle"
      style={{ paddingTop: 'var(--pf-t--global--spacer--md)', maxWidth: 720 }}
    >
      {body}
    </Content>
  )
}

export function CustomizationStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  const [activeTab, setActiveTab] = useState<CustomizationTabKey>('overview')

  const selectedTemplate = useMemo(
    () => VM_TEMPLATES.find((t) => t.id === state.selectedTemplateId) ?? null,
    [state.selectedTemplateId],
  )

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="customization-heading" headingLevel="h2" size="xl">
          Customization
        </Title>
        {state.mode === 'new' ? (
          <Content
            component="p"
            className="pf-v6-u-color-text-subtle"
            style={{ marginTop: 'var(--pf-t--global--spacer--sm)', maxWidth: 720 }}
          >
            Optional cloud-init user data. Leave blank to use defaults on create.
          </Content>
        ) : (
          <Content
            component="p"
            className="pf-v6-u-color-text-subtle"
            style={{ marginTop: 'var(--pf-t--global--spacer--sm)', maxWidth: 720 }}
          >
            Customize your virtual machine by exploring the tabs below.
          </Content>
        )}
      </StackItem>
      <StackItem>
        {state.mode === 'template' && (
          <Form>
            <FormGroup label="Virtual machine name" fieldId="template-vm-name" isRequired>
              <TextInput
                id="template-vm-name"
                value={state.templateVmName}
                onChange={(_e, v) => update('templateVmName', v)}
                placeholder="Enter a name for this virtual machine"
              />
            </FormGroup>
          </Form>
        )}
        {state.mode === 'new' && (
          <Form>
            <FormGroup label="Cloud-init user data (optional)" fieldId="cloud-init-user-data">
              <TextArea
                id="cloud-init-user-data"
                value={state.cloudInitUserDataNew}
                onChange={(_e, v) => update('cloudInitUserDataNew', v)}
                rows={6}
                placeholder="#cloud-config or shell script"
                resizeOrientation="vertical"
              />
            </FormGroup>
          </Form>
        )}
        {state.mode === 'template' && (
          <Tabs
            id="cvm-customization-tabs"
            aria-label="Virtual machine customization"
            activeKey={activeTab}
            onSelect={(_e, k) => setActiveTab(k as CustomizationTabKey)}
            style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}
          >
            <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
              <Stack hasGutter style={{ paddingTop: 'var(--pf-t--global--spacer--md)' }}>
                <DescriptionList
                  isCompact
                  aria-label="Template resource summary"
                  columnModifier={{ default: '2Col' }}
                >
                  <DescriptionListGroup>
                    <DescriptionListTerm>Template</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selectedTemplate?.title ?? '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>CPU</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selectedTemplate ? `${selectedTemplate.defaultCores} vCPU` : '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Memory</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selectedTemplate ? `${selectedTemplate.defaultMemoryGib} GiB` : '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Storage</DescriptionListTerm>
                    <DescriptionListDescription>40 GiB root volume (demo default)</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Network</DescriptionListTerm>
                    <DescriptionListDescription>Default pod network</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
                <Stack hasGutter>
                  <Switch
                    id="cvm-customization-headless"
                    label="Headless mode"
                    isChecked={state.headless}
                    onChange={(_e, checked) => update('headless', checked)}
                  />
                  <Switch
                    id="cvm-customization-guest-log"
                    label="Guest system log access"
                    isChecked={state.guestLogAccess ?? true}
                    onChange={(_e, checked) => update('guestLogAccess', checked)}
                  />
                  <Switch
                    id="cvm-customization-deletion-protection"
                    label="Deletion protection"
                    isChecked={state.logDeletion ?? true}
                    onChange={(_e, checked) => update('logDeletion', checked)}
                  />
                </Stack>
              </Stack>
            </Tab>
            {PLACEHOLDER_TABS.map((t) => (
              <Tab key={t.key} eventKey={t.key} title={<TabTitleText>{t.title}</TabTitleText>}>
                <PlaceholderTabPanel body={t.body} />
              </Tab>
            ))}
          </Tabs>
        )}
      </StackItem>
    </Stack>
  )
}
