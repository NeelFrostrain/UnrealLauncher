// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import PageWrapper from '../layout/PageWrapper'
import { AboutFooter } from '../components/about/AboutFooter'
import { AboutHero } from '../components/about/AboutHero'
import { AboutFeatureGrid } from '../components/about/AboutFeatureGrid'
import { AboutFeatureCounts } from '../components/about/AboutFeatureCounts'
import { AboutArchitecture } from '../components/about/AboutArchitecture'
import { AboutIpcModules } from '../components/about/AboutIpcModules'
import { AboutDataStorage } from '../components/about/AboutDataStorage'
import { AboutTechStack } from '../components/about/AboutTechStack'
import { useAppVersion } from '../hooks/useAppVersion'
// import AboutChangelog from '@renderer/components/about/AboutChangelog'

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const appVersion = useAppVersion()

  const content = (
    <>
      <div className="space-y-6 pb-8 p-5">
        <AboutHero version={appVersion} />
        <AboutFeatureGrid />
        <AboutFeatureCounts />
        <AboutArchitecture />
        <AboutIpcModules />
        <AboutDataStorage />
        <AboutTechStack />
        {/* <AboutChangelog /> */}
        <AboutFooter />
      </div>
    </>
  )

  if (modal) return content

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto">{content}</div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
