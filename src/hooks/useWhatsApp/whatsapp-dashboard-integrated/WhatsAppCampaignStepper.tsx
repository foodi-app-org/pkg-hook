'use client'

import { useUploadWhatsAppCampaign } from 'npm-pkg-hook'
import { useContext, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { Context } from '@/context/Context'
import {
  createCleanCampaignFile,
  downloadWhatsAppTemplate,
  parseCampaignExcel,
  type CampaignExcelPreview,
} from './campaignExcel'
import styles from './whatsapp-campaign.module.css'

interface WhatsAppCampaignStepperProps {
  isReady: boolean
}

type Notice = {
  title: string
  description: string
  backgroundColor: 'success' | 'error'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
}

export default function WhatsAppCampaignStepper({ isReady }: WhatsAppCampaignStepperProps) {
  const context = useContext(Context)
  const sendNotification = context?.sendNotification
  const uploadCampaignMutation = useUploadWhatsAppCampaign()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<0 | 1>(0)
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CampaignExcelPreview | null>(null)
  const [readingFile, setReadingFile] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const notify = (notice: Notice) => {
    sendNotification?.(notice)
  }

  const resetCampaign = () => {
    setStep(0)
    setCampaignName('')
    setMessage('')
    setSelectedFile(null)
    setPreview(null)
    setReadingFile(false)
    setSuccessMessage('')
    uploadCampaignMutation.reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setReadingFile(true)
    setSelectedFile(file)
    setPreview(null)
    setSuccessMessage('')
    setStep(0)

    try {
      const result = await parseCampaignExcel(file)
      setPreview(result)

      if (result.invalidRows.length > 0) {
        notify({
          title: 'Revisa el archivo Excel',
          description: `Hay ${result.invalidRows.length} fila(s) con teléfonos inválidos. Corrígelas antes de continuar.`,
          backgroundColor: 'error',
        })
      } else if (result.duplicateCount > 0) {
        notify({
          title: 'Archivo revisado',
          description: `Se detectaron ${result.duplicateCount} duplicado(s). Se enviará un solo mensaje por número.`,
          backgroundColor: 'success',
        })
      }
    } catch (error) {
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      notify({
        title: 'No se pudo leer el archivo',
        description: getErrorMessage(error),
        backgroundColor: 'error',
      })
    } finally {
      setReadingFile(false)
    }
  }

  const handleNext = () => {
    if (!selectedFile || !preview) {
      notify({
        title: 'Archivo requerido',
        description: 'Selecciona una plantilla Excel con la columna telefono.',
        backgroundColor: 'error',
      })
      return
    }

    if (preview.numbers.length === 0) {
      notify({
        title: 'No hay destinatarios válidos',
        description: 'Agrega al menos un teléfono válido en el Excel.',
        backgroundColor: 'error',
      })
      return
    }

    if (preview.invalidRows.length > 0) {
      notify({
        title: 'Debes corregir el Excel',
        description: 'Hay teléfonos inválidos. Corrige las filas indicadas y vuelve a cargar el archivo.',
        backgroundColor: 'error',
      })
      return
    }

    setStep(1)
  }

  const handleCreateCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isReady) {
      notify({
        title: 'WhatsApp no está listo',
        description: 'Conecta WhatsApp antes de crear una campaña.',
        backgroundColor: 'error',
      })
      return
    }

    if (!preview || !selectedFile || preview.numbers.length === 0 || preview.invalidRows.length > 0) {
      setStep(0)
      notify({
        title: 'Excel inválido',
        description: 'Carga y valida un archivo Excel con teléfonos válidos.',
        backgroundColor: 'error',
      })
      return
    }

    if (!campaignName.trim() || !message.trim()) {
      notify({
        title: 'Faltan datos',
        description: 'Completa el nombre de la campaña y el mensaje.',
        backgroundColor: 'error',
      })
      return
    }

    try {
      // Se genera una versión limpia para quitar duplicados y normalizar los teléfonos.
      const cleanFile = createCleanCampaignFile(preview.numbers)
      const response = await uploadCampaignMutation.mutateAsync({
        file: cleanFile,
        campaignName: campaignName.trim(),
        message: message.trim(),
      })

      const recipientCount = typeof response.totalRecipients === 'number'
        ? response.totalRecipients
        : preview.numbers.length
      const resultMessage = response.message ?? `El backend aceptó la campaña para ${recipientCount} destinatario(s).`

      setSuccessMessage(resultMessage)
      notify({
        title: 'Campaña creada',
        description: resultMessage,
        backgroundColor: 'success',
      })
    } catch (error) {
      notify({
        title: 'No se pudo crear la campaña',
        description: getErrorMessage(error),
        backgroundColor: 'error',
      })
    }
  }

  const isBusy = readingFile || uploadCampaignMutation.isPending
  const validRecipientCount = preview?.numbers.length ?? 0

  return (
    <div className={styles.campaignContainer}>
      <div className={`${styles.sessionNotice} ${isReady ? styles.sessionNoticeReady : ''}`} role="status" aria-live="polite">
        <span className={styles.sessionNoticeDot} />
        <span>{isReady ? 'Sesión lista para enviar mensajes' : 'Conecta WhatsApp para habilitar la creación de campañas'}</span>
      </div>

      <div className={styles.stepper} aria-label="Pasos para crear una campaña">
        <div className={`${styles.step} ${step === 0 ? styles.stepActive : styles.stepComplete}`}>
          <span className={styles.stepNumber}>{step === 0 ? '1' : '✓'}</span>
          <span>Subir archivo Excel</span>
        </div>
        <div className={`${styles.step} ${step === 1 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>2</span>
          <span>Configurar campaña</span>
        </div>
      </div>

      {step === 0 ? (
        <div className={styles.uploadStep}>
          <div className={styles.stepIntro}>
            <h3>Sube tu lista de destinatarios</h3>
            <p>Importa los números desde Excel, revisa la validación y después define el mensaje que recibirán.</p>
          </div>

          <div className={styles.dropzone}>
            <span className={styles.fileIcon} aria-hidden="true">XLS</span>
            <strong>Archivo de destinatarios</strong>
            <p>Usa un archivo .xlsx o .xls con una columna llamada <code>telefono</code>. Incluye el indicativo de país, por ejemplo 573001234567.</p>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              id="whatsapp-campaign-excel"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(event) => void handleFileChange(event)}
              disabled={isBusy}
            />
            <label className={styles.secondaryButton} htmlFor="whatsapp-campaign-excel">
              {readingFile ? 'Leyendo archivo…' : selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo Excel'}
            </label>
            <button className={styles.textButton} type="button" onClick={downloadWhatsAppTemplate}>
              Descargar plantilla Excel
            </button>
          </div>

          {selectedFile && preview && (
            <section className={styles.fileSummary} aria-live="polite">
              <div className={styles.fileSummaryHeader}>
                <div>
                  <strong className={styles.fileName}>{selectedFile.name}</strong>
                  <p className={styles.mutedText}>Archivo leído correctamente</p>
                </div>
                <button className={styles.textButton} type="button" onClick={resetCampaign} disabled={isBusy}>
                  Quitar archivo
                </button>
              </div>

              <div className={styles.metrics}>
                <div><strong>{preview.totalNonEmptyRows}</strong><span>Filas detectadas</span></div>
                <div><strong>{validRecipientCount}</strong><span>Números válidos y únicos</span></div>
                <div><strong>{preview.duplicateCount}</strong><span>Duplicados omitidos</span></div>
                <div className={preview.invalidRows.length > 0 ? styles.metricError : ''}>
                  <strong>{preview.invalidRows.length}</strong><span>Filas inválidas</span>
                </div>
              </div>

              {preview.invalidRows.length > 0 && (
                <div className={styles.validationErrors} role="alert">
                  <strong>Corrige estas filas antes de continuar:</strong>
                  <ul>
                    {preview.invalidRows.slice(0, 8).map((row) => (
                      <li key={`${row.rowNumber}-${row.value}`}>
                        Fila {row.rowNumber}: <code>{row.value}</code> — {row.reason}
                      </li>
                    ))}
                  </ul>
                  {preview.invalidRows.length > 8 && <p>Y {preview.invalidRows.length - 8} fila(s) inválida(s) más.</p>}
                </div>
              )}
            </section>
          )}

          {!isReady && (
            <p className={styles.disabledHint} role="status">
              WhatsApp aún no está listo. Puedes preparar el Excel, pero necesitarás conectar la sesión para crear la campaña.
            </p>
          )}

          <div className={styles.stepActions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleNext}
              disabled={isBusy || !preview || preview.numbers.length === 0 || preview.invalidRows.length > 0}
            >
              Siguiente: configurar campaña <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.campaignForm} onSubmit={handleCreateCampaign}>
          {successMessage ? (
            <div className={styles.successPanel} role="status" aria-live="polite">
              <span className={styles.successIcon} aria-hidden="true">✓</span>
              <div>
                <h3>Campaña creada</h3>
                <p>{successMessage}</p>
                <p className={styles.mutedText}>Destinatarios preparados: {validRecipientCount}. El resultado depende de lo que haya confirmado el backend.</p>
              </div>
              <button type="button" className={styles.primaryButton} onClick={resetCampaign}>Crear otra campaña</button>
            </div>
          ) : (
            <>
              <div className={styles.stepIntro}>
                <h3>Configura tu campaña</h3>
                <p>El mismo mensaje se enviará a cada número válido y único del archivo.</p>
              </div>

              <label className={styles.field}>
                <span>Nombre de la campaña <b aria-hidden="true">*</b></span>
                <input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder="Ej. Promoción de octubre"
                  maxLength={100}
                  required
                  disabled={isBusy}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.labelRow}>
                  <span>Mensaje <b aria-hidden="true">*</b></span>
                  <span className={styles.characterCount}>{message.length} caracteres</span>
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="¡Hola! Tenemos novedades para ti…"
                  rows={6}
                  required
                  disabled={isBusy}
                />
              </label>

              <div className={styles.campaignSummary}>
                <div><span>Campaña</span><strong>{campaignName.trim() || 'Sin nombre'}</strong></div>
                <div><span>Destinatarios</span><strong>{validRecipientCount}</strong></div>
                <div><span>Archivo</span><strong>{selectedFile?.name ?? 'Sin archivo'}</strong></div>
              </div>

              {!isReady && <p className={styles.disabledHint}>Conecta WhatsApp y espera el estado “ready” para crear la campaña.</p>}
              {uploadCampaignMutation.isError && (
                <div className={styles.validationErrors} role="alert">
                  {getErrorMessage(uploadCampaignMutation.error)}
                </div>
              )}

              <div className={styles.stepActions}>
                <button className={styles.secondaryButton} type="button" onClick={() => setStep(0)} disabled={isBusy}>
                  ← Volver al Excel
                </button>
                <button className={styles.primaryButton} type="submit" disabled={!isReady || isBusy || !campaignName.trim() || !message.trim()}>
                  {uploadCampaignMutation.isPending ? 'Creando campaña…' : 'Crear campaña'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  )
}
