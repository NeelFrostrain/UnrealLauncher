// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import PageWrapper from '../layout/PageWrapper'
import { AboutFooter } from '../components/about/AboutFooter'
import { AboutHero } from '../components/about/AboutHero'
import { AboutFeatureGrid } from '../components/about/AboutFeatureGrid'
import { AboutFeatureCounts } from '../components/about/AboutFeatureCounts'
import { AboutArchitecture } from '../components/about/AboutArchitecture'
import { AboutIpcModules } from '../components/about/AboutIpcModules'
import { AboutDataStorage } from '../components/about/AboutDataStorage'
import { AboutTechStack } from '../components/about/AboutTechStack'

const AboutPage = ({ modal = false }: { modal?: boolean }): React.ReactElement => {
  const content = (
    <>
      <div className="space-y-6 pb-8 p-5">
        <AboutHero />
        <AboutFeatureGrid />
        <AboutFeatureCounts />
        <AboutArchitecture />
        <AboutIpcModules />
        <AboutDataStorage />
        <AboutTechStack />
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
