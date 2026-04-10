import { type RefObject } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { type ThemeToken } from '../../utils/theme'

export interface SavedProfilesSectionProps {
  profiles: Array<{ id: string; name: string; tokens: Record<ThemeToken, string> }>
  activeProfileId: string | null
  savingProfile: boolean
  setSavingProfile: (value: boolean) => void
  newProfileName: string
  setNewProfileName: (value: string) => void
  editingProfileId: string | null
  editingName: string
  setEditingName: (value: string) => void
  nameInputRef: RefObject<HTMLInputElement | null>
  handleSaveProfile: () => void
  handleStartEdit: (id: string, currentName: string) => void
  handleFinishEdit: () => void
  applyProfile: (id: string) => void
  deleteProfile: (id: string) => void
}

const SavedProfilesSection = ({
  profiles,
  activeProfileId,
  savingProfile,
  setSavingProfile,
  newProfileName,
  setNewProfileName,
  editingProfileId,
  editingName,
  setEditingName,
  nameInputRef,
  handleSaveProfile,
  handleStartEdit,
  handleFinishEdit,
  applyProfile,
  deleteProfile
}: SavedProfilesSectionProps): React.ReactElement => (
  <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        Saved profiles
      </p>
      {!savingProfile && (
        <button
          onClick={() => {
            setSavingProfile(true)
            setTimeout(() => nameInputRef.current?.focus(), 50)
          }}
          className="flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Plus size={12} />
          Save current
        </button>
      )}
    </div>

    {savingProfile && (
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={nameInputRef}
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveProfile()
            if (e.key === 'Escape') setSavingProfile(false)
          }}
          placeholder="Profile name…"
          className="flex-1 px-3 py-1.5 text-xs outline-none"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        />
        <button
          onClick={handleSaveProfile}
          className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white cursor-pointer"
        >
          Save
        </button>
        <button
          onClick={() => setSavingProfile(false)}
          className="p-1.5 cursor-pointer transition-colors"
          style={{ borderRadius: 'var(--radius)', color: 'var(--color-text-muted)' }}
        >
          <X size={13} />
        </button>
      </div>
    )}

    {profiles.length === 0 && !savingProfile && (
      <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
        No saved profiles yet.
      </p>
    )}

    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
    >
      {profiles.map((profile) => {
        const isActive = activeProfileId === profile.id
        return (
          <div
            key={profile.id}
            className="relative group rounded-lg p-2.5 border-2 transition-all cursor-pointer"
            style={{
              background: profile.tokens['surface'],
              borderColor: isActive ? profile.tokens['accent'] : 'rgba(255,255,255,0.08)'
            }}
            onClick={() => !isActive && applyProfile(profile.id)}
          >
            <div className="flex gap-1 mb-2">
              {(['accent', 'surface-elevated', 'surface-card'] as ThemeToken[]).map((t) => (
                <div
                  key={t}
                  className="w-3 h-3 rounded-full"
                  style={{ background: profile.tokens[t] }}
                />
              ))}
            </div>

            {editingProfileId === profile.id ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') handleFinishEdit()
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[11px] bg-transparent outline-none"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            ) : (
              <>
                <p
                  className="text-[11px] font-medium leading-snug wrap-break-word"
                  style={{ color: profile.tokens['text-secondary'] }}
                >
                  {profile.name}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{
                    color: profile.tokens['text-secondary'],
                    fontFamily: profile.tokens['font-family'],
                    fontSize: profile.tokens['font-size']
                  }}
                >
                  Aa · {profile.tokens['font-size']}
                </p>
              </>
            )}

            {isActive && (
              <div
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: profile.tokens['accent'] }}
              >
                <Check size={9} className="text-white" />
              </div>
            )}

            <div
              className="flex items-center gap-1 mt-2 pt-1.5"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartEdit(profile.id, profile.name)
                }}
                className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}
                title="Rename"
              >
                <Pencil size={10} />
                Rename
              </button>
              <span className="text-[10px]" style={{ color: 'var(--color-border)' }}>
                ·
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteProfile(profile.id)
                }}
                className="flex items-center gap-1 text-[10px] hover:text-red-400 transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}
                title="Delete"
              >
                <Trash2 size={10} />
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default SavedProfilesSection
