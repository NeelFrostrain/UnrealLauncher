import { useEffect, useState } from 'react'
import PageWrapper from '../layout/PageWrapper'
import AboutFeatures from '../components/about/AboutFeatures'
import AboutUsage from '../components/about/AboutUsage'
import { AboutKnownIssues, AboutTechnical, AboutContributing, AboutCodeOfConduct, AboutSecurity, AboutSupport, AboutFooter } from '../components/about/AboutInfo'
import AboutUpdates from '../components/about/AboutUpdates'
import AboutChangelog from '../components/about/AboutChangelog'

const AboutPage = (): React.ReactElement => {
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (window.electronAPI?.getAppVersion) {
        try { setAppVersion(await window.electronAPI.getAppVersion()) }
        catch (err) { console.error('Failed to get app version:', err) }
      }
    }
    void load()
  }, [])

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          <AboutFeatures />
          <AboutUsage />
          <AboutKnownIssues />
          <AboutTechnical />
          <AboutContributing />
          <AboutCodeOfConduct />
          <AboutSecurity />
          <AboutSupport />
          <AboutUpdates appVersion={appVersion} />
          <AboutChangelog />
          <AboutFooter />
        </div>
      </div>
    </PageWrapper>
  )
}

export default AboutPage
