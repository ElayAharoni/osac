import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core'
import type { ClusterTemplate } from '@osac/api-contracts'

interface TemplateCardProps {
  template: ClusterTemplate
  isSelected: boolean
  isProvisionBlocked: boolean
  onClick: () => void
  onCreateFromTemplate: () => void
}

export function TemplateCard({
  template,
  isSelected,
  isProvisionBlocked,
  onClick,
  onCreateFromTemplate,
}: TemplateCardProps) {
  const iconEmoji = template.icon === 'rhel' ? '🐧' : template.icon === 'windows' ? '🪟' : '🐧'

  return (
    // isClickable + isSelectable allows both the whole-card click action (selectableActions)
    // and the nested "Create VM" Button to coexist without a PF accessibility warning.
    <Card isClickable isSelectable isSelected={isSelected} isFullHeight>
      <CardHeader
        selectableActions={{
          onClickAction: onClick,
          selectableActionAriaLabel: `Select template ${template.title}`,
        }}
      >
        <CardTitle>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsXs' }}
          >
            <FlexItem>{iconEmoji}</FlexItem>
            <FlexItem>{template.title}</FlexItem>
          </Flex>
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
        <Flex
          flexWrap={{ default: 'wrap' }}
          spaceItems={{ default: 'spaceItemsXs' }}
          style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}
        >
          {(template.tags ?? []).slice(0, 3).map((tag) => (
            <Label key={tag} isCompact color="blue" variant="outline">
              {tag}
            </Label>
          ))}
        </Flex>
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
