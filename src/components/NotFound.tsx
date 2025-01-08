import { useLocation } from '@tanstack/react-router'

import { LinkButton } from './Button'
import ErrorWrapper from './ErrorWrapper'
import Highlight from './Highlight'
import { ReportButton } from './Reporter'

export default function NotFound() {
  const location = useLocation()

  return (
    <ErrorWrapper
      title="Oops! You found a missing page."
      description={
        <>
          <p className="mb-2">
            OverBuddy tried to access <Highlight>{location.pathname}</Highlight>{' '}
            but that route does not exist.
          </p>
          <p>Please report this issue to the developer.</p>
        </>
      }
      buttons={
        <>
          <LinkButton primary to="/" replace>
            Continue
          </LinkButton>
          <ReportButton
            error={
              new Error(
                `Navigated to route "${location.pathname}", which does not exist.`
              )
            }
          />
        </>
      }
    />
  )
}
