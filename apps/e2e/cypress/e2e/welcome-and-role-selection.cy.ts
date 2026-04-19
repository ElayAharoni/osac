/**
 * E2E: welcome-and-role-selection (flow id: welcome-and-role-selection)
 * Covers: wrs_welcome_landing step
 */
describe('welcome-and-role-selection', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows welcome heading and demo alert', () => {
    cy.contains('h1', 'Welcome to OSAC').should('be.visible')
    cy.contains('Demo entry').should('be.visible')
  })

  it('shows provider admin card with Enter button', () => {
    cy.contains('Provider Admin').should('be.visible')
    cy.contains('button', 'Enter').should('be.visible')
  })

  it('shows tenant org cards for Northstar Bank and Bluestone', () => {
    cy.contains('Northstar Bank').should('be.visible')
    cy.contains('Bluestone Financial Group').should('be.visible')
  })

  it('clicking Enter on provider admin navigates to sign-in', () => {
    cy.contains('button', 'Enter').first().click()
    cy.url().should('include', '/sign-in')
    cy.contains('Vertexa').should('be.visible')
  })
})
