import { useId, useState, type FormEvent, type ReactNode } from 'react'

import type { ActivityLogFormInput, ActivityLogRecordInput, FieldError, SpoilerLevel } from '../domain/index'
import { validateActivityLog } from '../domain/index'
import { Button, Notice, TextArea, TextField } from '../ui/index'
import styles from './LogForm.module.css'

type LogFormProps = {
  mode: 'create' | 'edit'
  initialValue: ActivityLogFormInput
  categorySuggestions: string[]
  tagSuggestions: string[]
  saving: boolean
  saveError: ReactNode | null
  onSave: (value: ActivityLogRecordInput) => Promise<void>
}

const spoilerOptions: Array<{ value: SpoilerLevel; label: string; description: string }> = [
  { value: 'none', label: 'ネタバレなし', description: '作品や展開の核心に触れない' },
  { value: 'minor', label: '軽微なネタバレ', description: '見た人が推測できる程度の内容に触れる' },
  { value: 'major', label: '重大なネタバレ', description: '結末や核心的な展開に触れる' },
]

function errorFor(errors: FieldError[], field: FieldError['field']): string | undefined {
  return errors.find((error) => error.field === field)?.message
}

function displayValue(value: string | undefined): string {
  return value === undefined || value === '' ? 'なし' : value
}

export function LogForm({ mode, initialValue, categorySuggestions, tagSuggestions, saving, saveError, onSave }: LogFormProps) {
  const [value, setValue] = useState(initialValue)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [confirmedValue, setConfirmedValue] = useState<ActivityLogRecordInput | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const categoryListId = useId()
  const tagListId = useId()
  const tagsError = errorFor(errors, 'tags')
  const urlsError = errorFor(errors, 'urls')
  const spoilerError = errorFor(errors, 'spoiler')

  function update<K extends keyof ActivityLogFormInput>(field: K, next: ActivityLogFormInput[K]) {
    setValue((current) => ({ ...current, [field]: next }))
    setErrors((current) => current.filter((error) => error.field !== field))
  }

  function addTag() {
    if (tagDraft.trim() === '') return
    update('tags', [...value.tags, tagDraft])
    setTagDraft('')
  }

  function addUrl() {
    update('urls', [...value.urls, ''])
  }

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateActivityLog(value)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    setConfirmedValue(result.value)
  }

  if (confirmedValue !== null) {
    const spoiler = spoilerOptions.find((option) => option.value === confirmedValue.spoiler)
    return <section className={styles.container} aria-labelledby="confirmation-title">
      <h1 id="confirmation-title">{mode === 'create' ? '保存内容の確認' : '編集内容の確認'}</h1>
      <Notice variant="public">
        {mode === 'create'
          ? 'この内容はAT Protocol上の公開データとして保存されます。'
          : '編集後の内容もAT Protocol上の公開データとして扱われます。'}
      </Notice>
      <dl className={styles.summary}>
        <div><dt>タイトル</dt><dd>{confirmedValue.title}</dd></div>
        <div><dt>活動日</dt><dd>{confirmedValue.activityDate}</dd></div>
        <div><dt>活動種別</dt><dd>{displayValue(confirmedValue.category)}</dd></div>
        <div><dt>対象名</dt><dd>{displayValue(confirmedValue.subject)}</dd></div>
        <div><dt>タグ</dt><dd>{confirmedValue.tags?.length ? confirmedValue.tags.join('、') : 'なし'}</dd></div>
        <div><dt>外部URL</dt><dd>{confirmedValue.urls?.length ? <ul>{confirmedValue.urls.map((url) => <li key={url}>{url}</li>)}</ul> : 'なし'}</dd></div>
        <div><dt>メモ</dt><dd className={styles.preWrap}>{displayValue(confirmedValue.note)}</dd></div>
        <div><dt>ネタバレ</dt><dd>{spoiler?.label ?? 'ネタバレなし'}{confirmedValue.spoiler !== 'none' && spoiler ? `（${spoiler.description}）` : ''}</dd></div>
      </dl>
      {saveError}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" disabled={saving} onClick={() => setConfirmedValue(null)}>入力へ戻る</Button>
        <Button type="button" disabled={saving} onClick={() => void onSave(confirmedValue)}>{saving ? '保存中…' : mode === 'create' ? 'この内容で保存' : 'この内容で更新'}</Button>
      </div>
    </section>
  }

  return <section className={styles.container}>
    <h1>{mode === 'create' ? '活動ログを作成' : '活動ログを編集'}</h1>
    <form noValidate onSubmit={proceed}>
      <TextField label="タイトル" required value={value.title} error={errorFor(errors, 'title')} onChange={(event) => update('title', event.target.value)} />
      <TextField label="活動日" required type="date" value={value.activityDate} error={errorFor(errors, 'activityDate')} onChange={(event) => update('activityDate', event.target.value)} />
      <TextField label="活動種別" list={categoryListId} value={value.category} error={errorFor(errors, 'category')} onChange={(event) => update('category', event.target.value)} />
      <datalist id={categoryListId}>{categorySuggestions.map((category) => <option key={category} value={category} />)}</datalist>
      <TextField label="対象名" value={value.subject} error={errorFor(errors, 'subject')} onChange={(event) => update('subject', event.target.value)} />

      <fieldset className={styles.group} aria-describedby={tagsError ? 'tags-error' : undefined}>
        <legend>タグ</legend>
        {value.tags.length > 0 && <ul className={styles.chips}>{value.tags.map((tag, index) => <li key={`${tag}-${index}`}><span>{tag}</span><button type="button" aria-label={`${tag}を削除`} onClick={() => update('tags', value.tags.filter((_, itemIndex) => itemIndex !== index))}>×</button></li>)}</ul>}
        <div className={styles.inlineInput}>
          <input aria-label="追加するタグ" list={tagListId} value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} />
          <Button type="button" variant="secondary" onClick={addTag}>追加</Button>
        </div>
        <datalist id={tagListId}>{tagSuggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
        {tagsError && <p id="tags-error" className={styles.fieldError} role="alert">⚠ {tagsError}</p>}
      </fieldset>

      <fieldset className={styles.group} aria-describedby={urlsError ? 'urls-error' : undefined}>
        <legend>外部URL</legend>
        <div className={styles.repeatList}>{value.urls.map((url, index) => <div className={styles.inlineInput} key={index}>
          <input type="url" aria-label={`外部URL ${index + 1}`} value={url} onChange={(event) => update('urls', value.urls.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
          <Button type="button" variant="secondary" aria-label={`外部URL ${index + 1}を削除`} onClick={() => update('urls', value.urls.filter((_, itemIndex) => itemIndex !== index))}>削除</Button>
        </div>)}</div>
        <Button type="button" variant="secondary" onClick={addUrl}>URLを追加</Button>
        {urlsError && <p id="urls-error" className={styles.fieldError} role="alert">⚠ {urlsError}</p>}
      </fieldset>

      <TextArea label="メモ" rows={7} value={value.note} error={errorFor(errors, 'note')} onChange={(event) => update('note', event.target.value)} />

      <fieldset className={styles.group} aria-describedby={spoilerError ? 'spoiler-error' : undefined}>
        <legend>ネタバレ</legend>
        <div className={styles.radioList}>{spoilerOptions.map((option) => <label key={option.value}>
          <input type="radio" name="spoiler" value={option.value} checked={value.spoiler === option.value} onChange={() => update('spoiler', option.value)} />
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
        </label>)}</div>
        {spoilerError && <p id="spoiler-error" className={styles.fieldError} role="alert">⚠ {spoilerError}</p>}
      </fieldset>
      <div className={styles.actions}><Button type="submit">保存内容を確認</Button></div>
    </form>
  </section>
}
