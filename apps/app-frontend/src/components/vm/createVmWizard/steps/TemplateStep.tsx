import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  SearchInput,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { VM_TEMPLATES } from '@osac/api-contracts'
import type { UpdateFn, WizardState } from '../types'

interface TemplateStepProps {
  state: WizardState
  update: UpdateFn
  search: string
  setSearch: (s: string) => void
  templates: typeof VM_TEMPLATES
}

export function TemplateStep({ state, update, search, setSearch, templates }: TemplateStepProps) {
  return (
    <Stack hasGutter>
      <StackItem>
        <SearchInput
          placeholder="Search templates…"
          value={search}
          onChange={(_e, v) => setSearch(v)}
          onClear={() => setSearch('')}
          style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
        />
      </StackItem>
      <StackItem>
        <Gallery hasGutter style={{ maxHeight: 320, overflowY: 'auto' }}>
          {templates.map((tpl) => (
            <GalleryItem key={tpl.id}>
              <Card
                isSelectable
                isSelected={state.selectedTemplateId === tpl.id}
                isCompact
                onClick={() => update('selectedTemplateId', tpl.id)}
                style={{ cursor: 'pointer' }}
              >
                <CardBody>
                  <CardTitle style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
                    {tpl.title}
                  </CardTitle>
                  {tpl.description && (
                    <Content
                      component="small"
                      style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
                    >
                      {tpl.description.length > 60 ? '…' : ''}
                    </Content>
                  )}
                  <Flex
                    flexWrap={{ default: 'wrap' }}
                    spaceItems={{ default: 'spaceItemsXs' }}
                    style={{ marginTop: 4 }}
                  >
                    {(tpl.tags ?? []).slice(0, 2).map((tag) => (
                      <FlexItem key={tag}>
                        <Label isCompact color="blue" variant="outline">
                          {tag}
                        </Label>
                      </FlexItem>
                    ))}
                  </Flex>
                </CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </StackItem>
    </Stack>
  )
}
