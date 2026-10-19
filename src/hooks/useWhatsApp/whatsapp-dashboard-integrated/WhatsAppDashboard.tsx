'use client'



import { useQueryClient } from '@tanstack/react-query'

import {

  isReadyStatus,

  isSessionEstablishedStatus,

  statusHasSession,

  useRefreshWhatsApp,

  useSendWhatsAppMessage,

  useWhatsAppMessageStats,

  useWhatsAppQR,

  useWhatsAppStatus,

  whatsappKeys

} from 'npm-pkg-hook'

import {

 Button, Column, getGlobalStyle, Icon, Image, PhoneInput, Text 

} from 'pkg-components'

import {

  type FormEvent, type ReactNode, useContext, useEffect, useRef, useState

} from 'react'



import { Context } from '@/context/Context'



import styles from './styles.module.css'
import campaignStyles from './whatsapp-campaign.module.css'
import WhatsAppCampaignStepper from './WhatsAppCampaignStepper'



type IconName =

  | 'grid'

  | 'link'

  | 'message'

  | 'send'

  | 'refresh'

  | 'check'

  | 'arrow'

  | 'sparkles'

  | 'iconshield'





const iconPaths: Record<IconName, ReactNode> = {

  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,

  link: <><path d="M10 13.5a4.5 4.5 0 0 0 6.7.5l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7" /><path d="M14 10.5a4.5 4.5 0 0 0-6.7-.5l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7" /></>,

  message: <><path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,

  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,

  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12" /><path d="M18.4 15a7 7 0 0 1-11.6 2L4 12" /></>,

  check: <path d="m5 12 4 4L19 6" />,

  arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,

  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1Z" /></>,

  iconshield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,

}





function normalizeStatus(value?: string): string {

  return value?.trim().toLowerCase() ?? 'unknown'

}



export default function WhatsAppDashboard() {

  const queryClient = useQueryClient()

  const refreshWhatsApp = useRefreshWhatsApp()

  const lastSessionEstablished = useRef(false)

  const context = useContext(Context)

  const sendNotification = context?.sendNotification



  const [phone, setPhone] = useState('')

  const [message, setMessage] = useState('')



  const statusQuery = useWhatsAppStatus()

  const status = statusQuery.data

  const currentStatus = normalizeStatus(status?.status)



  // El backend exige client.isReady() para enviar; authenticated no es suficiente.

  const isReady =

    status?.connected === true || currentStatus === 'ready' || currentStatus === 'connected'

  const isAuthenticated = currentStatus === 'authenticated'

  const hasSession = isReady || isAuthenticated



  const qrQuery = useWhatsAppQR({ enabled: !hasSession })

  const sendMutation = useSendWhatsAppMessage()

  const qrSrc = qrQuery.data?.dataUrl

  const messageStatsQuery = useWhatsAppMessageStats({ sendNotification })

  const messageStats = messageStatsQuery.data



  const statusTone = isReady

    ? styles.statusConnected

    : statusQuery.isError

      ? styles.statusError

      : statusQuery.isPending || isAuthenticated

        ? styles.statusPending

        : styles.statusDisconnected



  const statusLabel = statusQuery.isPending

    ? 'Verificando conexión'

    : statusQuery.isError

      ? 'Servidor no disponible'

      : isReady

        ? 'WhatsApp listo para enviar'

        : isAuthenticated

          ? 'Autenticado · preparando sesión'

          : currentStatus === 'qr_pending'

            ? 'Esperando escaneo QR'

            : `Estado: ${status?.status ?? 'Desconectado'}`



  const canSend = isReady && !sendMutation.isPending && Boolean(phone.trim()) && Boolean(message.trim())



  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {

    event.preventDefault()

    const normalizedPhone = phone.trim()

    const normalizedMessage = message.trim()



    if (!normalizedPhone || !normalizedMessage || !isReady) { return }



    try {

      // El backend espera exactamente { phone, message }.

      await sendMutation.mutateAsync({ phone: normalizedPhone, message: normalizedMessage })

      setMessage('')

    } catch {

      sendNotification({

        title: 'Error',

        description: 'Ocurrió un error',

        backgroundColor: 'error'

      })

    }

  }



  // Sincroniza un estado terminal informado por /qr con la caché compartida.

  // Este efecto vive en el componente, no dentro del paquete de hooks.

  useEffect(() => {

    const qrStatus = normalizeStatus(qrQuery.data?.status)



    if (!isSessionEstablishedStatus(qrStatus)) { return }



    const currentStatus = queryClient.getQueryData(

      whatsappKeys.status(),

    )

    const qrUpdatedAt = queryClient.getQueryState(whatsappKeys.qr())?.dataUpdatedAt ?? 0

    const statusUpdatedAt = queryClient.getQueryState(whatsappKeys.status())?.dataUpdatedAt ?? 0



    // Una respuesta de estado posterior que confirma desconexión prevalece.

    if (currentStatus && !statusHasSession(currentStatus) && statusUpdatedAt > qrUpdatedAt) {

      return

    }



    queryClient.setQueryData(whatsappKeys.status(), (previous) => {

      // Nunca degradar una sesión lista a authenticated.

      if (isReadyStatus(previous?.status) && !isReadyStatus(qrStatus)) {

        return previous

      }



      const connected = isReadyStatus(qrStatus)

      if (previous?.status === qrStatus && previous.connected === connected) {

        return previous

      }



      return {

        ...(previous ?? {}),

        status: qrStatus,

        connected,

      }

    })

  }, [queryClient, qrQuery.data?.status, qrQuery.dataUpdatedAt])



  // Si una sesión ya establecida pasa a desconectada, limpia el QR terminal

  // para permitir un nuevo ciclo de vinculación.

  useEffect(() => {

    const currentStatus = statusQuery.data

    const statusUpdatedAt = queryClient.getQueryState(whatsappKeys.status())?.dataUpdatedAt ?? 0

    const qrUpdatedAt = queryClient.getQueryState(whatsappKeys.qr())?.dataUpdatedAt ?? 0

    const qrStatus = qrQuery.data?.status

    const qrIsTerminal = isSessionEstablishedStatus(qrStatus)

    const sessionIsEstablished = statusHasSession(currentStatus)



    if (

      lastSessionEstablished.current &&

      currentStatus &&

      !sessionIsEstablished &&

      statusUpdatedAt > qrUpdatedAt &&

      qrIsTerminal

    ) {

      queryClient.setQueryData(whatsappKeys.qr(), (previous) => {

        if (!previous || !isSessionEstablishedStatus(previous.status)) { return previous }



        return {

          ...previous,

          status: normalizeStatus(currentStatus.status),

          qr: undefined,

          dataUrl: undefined,

          message: 'La sesión se desconectó. Solicitando un nuevo código QR.',

        }

      })

      lastSessionEstablished.current = false

      return

    }



    if (sessionIsEstablished || (qrIsTerminal && (!currentStatus || statusUpdatedAt <= qrUpdatedAt))) {

      lastSessionEstablished.current = true

    }

  }, [

    queryClient,

    statusQuery.data?.status,

    statusQuery.data?.connected,

    statusQuery.dataUpdatedAt,

    qrQuery.data?.status,

    qrQuery.dataUpdatedAt,

  ])



  async function handleRefresh() {

    await refreshWhatsApp()

  }



  return (

    <main className={styles.dashboardShell}>

      <aside className={styles.sidebar}>

        <a href="#overview" className={styles.brand} aria-label="WhatsApp Console, inicio">

          <span className={styles.brandMark}>

            <Icon icon='IconWhatsApp' />

          </span>

          <Column>

            <Text as='h2' weight='900'><strong>WhatsApp</strong></Text>

            <Text as='h3' weight='thin' size='sm'>CONSOLE</Text>

          </Column>

        </a>



        <div className={styles.workspace}>

          <span className={styles.workspaceAvatar}><Icon icon="IconShield" size={20} /></span>

          <Column>

            <Text weight='extrabold'>Mi espacio</Text>

            <Text>Panel de mensajería</Text>

          </Column>

          <span className={styles.workspaceChevron} aria-hidden="true">

            <Icon icon='IconArrowBottom' size={15} />

          </span>

        </div>



        <nav className={styles.navigation} aria-label="Navegación principal">

          <span className={styles.navSectionTitle}>GENERAL</span>

          <a href="#connection" className={styles.navItem}><Icon icon="IconLink" size={19} /><span>Conexión</span><span className={`${styles.navIndicator} ${isReady ? styles.navIndicatorConnected : ''}`} /></a>

          <a href="#send" className={styles.navItem}><Icon icon="IconWhatsApp" size={19} /><span>Enviar mensaje</span></a>

        </nav>



        <div className={styles.sidebarBottom}>

          <div className={styles.sidebarHelp}>

            <span className={styles.helpIcon}><Icon icon="IconWhatsApp" size={20} /></span>

            <strong>Conecta tu cuenta</strong>

            <p>Vincula WhatsApp y envía mensajes desde tu aplicación.</p>

            <a href="#connection" className={styles.helpLink}>Ver conexión <Icon icon="IconArrowRight" size={15} color={getGlobalStyle('--color-icons-black')} /></a>

          </div>

          <div className={styles.sidebarFooter}><span className={styles.footerDot} /><span>Panel de mensajería</span></div>

        </div>

      </aside>



      <div className={styles.mainContent}>

        <header className={styles.topbar}>

          <div className={`${styles.statusPill} ${statusTone}`} aria-live="polite"><span className={styles.statusDot} />{statusLabel}</div>

        </header>



        <div className={styles.pageContent}>

          <section id="overview" className={styles.hero}>

            <div>

              <Text>

              </Text>

              CENTRO DE MENSAJERÍA

              <h1>Tu WhatsApp, conectado.</h1>

              <p>Gestiona tu conexión y envía mensajes desde un solo lugar.</p>

            </div>

            <button type="button" className={styles.refreshButton} onClick={() => void handleRefresh()} disabled={statusQuery.isFetching || qrQuery.isFetching}>

              <span className={statusQuery.isFetching || qrQuery.isFetching ? styles.spinningIcon : ''}><Icon icon="IconReload" size={17} /></span>

              Actualizar estado

            </button>

          </section>



          <section className={styles.overviewCards} aria-label="Resumen de estado">

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconGreen}><Icon icon="IconLink" size={20} /></span><span className={styles.overviewCardLabel}>SESIÓN</span></div>

              <strong className={styles.overviewValue}>{statusQuery.isPending ? 'Verificando...' : isReady ? 'Lista' : isAuthenticated ? 'Autenticada' : 'Desconectada'}</strong>

              <span className={styles.overviewDescription}>Estado informado por el backend</span>

            </article>

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconPurple}><Icon icon="IconStar" size={20} color={getGlobalStyle('--color-text-crispy-mint-green')} /></span><span className={styles.overviewCardLabel}>MENSAJERÍA</span></div>

              <strong className={styles.overviewValue}>{isReady ? 'Disponible' : 'En espera'}</strong>

              <span className={styles.overviewDescription}>El backend debe informar `ready` para enviar</span>

            </article>

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconBlue}><Icon icon="IconShield" size={20} color={getGlobalStyle('--color-text-crispy-mint-green')} /></span><span className={styles.overviewCardLabel}>API</span></div>

              <strong className={styles.overviewValue}>{statusQuery.isError ? 'Sin respuesta' : statusQuery.isPending ? 'Consultando...' : 'Responde'}</strong>

              <span className={styles.overviewDescription}>Consulta de `/api/status`</span>

            </article>

          </section>



          <section className={styles.overviewCards} aria-label="Estadísticas de mensajes en tiempo real">

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconGreen}><Icon icon="IconArrowBottom" size={20} color={getGlobalStyle('--color-text-crispy-mint-green')} /></span><span className={styles.overviewCardLabel}>ENTRANTES</span></div>

              <strong className={styles.overviewValue}>{messageStatsQuery.isPending ? '...' : (messageStats?.incoming ?? 0)}</strong>

              <span className={styles.overviewDescription}>Promedio mensajes recibidos</span>

            </article>

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconPurple}><Icon icon="IconSendMessageV2" size={30} color={getGlobalStyle('--color-text-crispy-mint-green')} /></span><span className={styles.overviewCardLabel}>SALIENTES</span></div>

              <strong className={styles.overviewValue}>{messageStatsQuery.isPending ? '...' : (messageStats?.outgoing ?? 0)}</strong>

              <span className={styles.overviewDescription}>Promedio mensajes enviados</span>

            </article>

            <article className={styles.overviewCard}>

              <div className={styles.overviewCardTop}><span className={styles.overviewIconBlue}><Icon icon="IconActivity" size={20} /></span><span className={styles.overviewCardLabel}>TOTAL</span></div>

              <strong className={styles.overviewValue}>{messageStatsQuery.isPending ? '...' : (messageStats?.total ?? 0)}</strong>

              <span className={styles.overviewDescription}>Actividad registrada en esta sesión</span>

            </article>

          </section>



          <div className={styles.contentGrid}>

            <section id="connection" className={`${styles.card} ${styles.connectionCard}`}>

              <div className={styles.cardHeader}>

                <div><div className={styles.cardEyebrow}>CUENTA</div><h2>Conexión de WhatsApp</h2><p>Escanea el código QR para vincular tu cuenta.</p></div>

                <span className={`${styles.connectionBadge} ${isReady ? styles.connectionBadgeActive : styles.connectionBadgeInactive}`}><span className={styles.statusDot} />{isReady ? 'Lista' : isAuthenticated ? 'Preparando' : 'Pendiente'}</span>

              </div>



              {statusQuery.isError && <div className={styles.inlineError} role="alert"><span className={styles.alertSymbol}>!</span><div><strong>No se pudo consultar el estado</strong><p>{statusQuery.error instanceof Error ? statusQuery.error.message : 'Comprueba que el backend esté activo.'}</p></div></div>}



              {isReady ? (

                <div className={styles.connectedPanel}>

                  <div className={styles.connectedIcon}><Icon icon="IconWhatsApp" size={30} /></div>

                  <span className={styles.connectedLabel}>WHATSAPP LISTO</span>

                  <Text size='lg' align='center' as='h3' weight='900'>¡Tu WhatsApp está listo!</Text>

                  <p>El backend informa que la sesión está en estado `ready`. Ya puedes enviar mensajes.</p>

                </div>

              ) : isAuthenticated ? (

                <div className={styles.connectedPanel}>

                  <div className={styles.connectedIcon}><Icon icon="refresh" size={30} /></div><span className={styles.connectedLabel}>AUTENTICACIÓN COMPLETADA</span><h3>Preparando la sesión</h3>

                  <p>WhatsApp está autenticado, pero el backend todavía no informa `ready`. El envío se habilitará cuando el cliente esté listo.</p>

                </div>

              ) : (

                <>

                  <div className={styles.qrInstructions}><span className={styles.qrStepNumber}>01</span><div><h3>Escanea tu código QR</h3><p>Abre WhatsApp en tu teléfono y entra a Dispositivos vinculados para asociar tu cuenta.</p></div></div>

                  <div className={styles.qrStage}>

                    {qrQuery.isPending ? (

                      <div className={styles.qrPlaceholder}><span className={styles.spinner} /><strong>Preparando código QR</strong><span>Esperando respuesta del servidor...</span></div>

                    ) : qrQuery.isError ? (

                      <div className={styles.qrPlaceholder}><span className={styles.qrErrorIcon}>!</span><strong>No se pudo obtener el QR</strong><span>{qrQuery.error instanceof Error ? qrQuery.error.message : 'Intenta consultar nuevamente el código.'}</span><button type="button" onClick={() => void qrQuery.refetch()} className={styles.refreshButton}><Icon icon="refresh" size={16} /> Reintentar</button></div>

                    ) : qrSrc ? (

                      <div className={styles.qrImageWrapper}><Image className={styles.qrImage} src={qrSrc} alt="Código QR para vincular WhatsApp" /><span className={styles.qrImageCaption}>Escanea con tu teléfono</span></div>

                    ) : (

                      <div className={styles.qrPlaceholder}><span className={styles.qrEmptyIcon}><Icon icon="message" size={27} /></span><strong>QR todavía no disponible</strong><span>{qrQuery.data?.message ?? 'El backend aún no ha recibido un código QR.'}</span><button type="button" onClick={() => void qrQuery.refetch()} className={styles.refreshButton}><Icon icon="refresh" size={16} /> Consultar QR</button></div>

                    )}

                  </div>

                  <div className={styles.qrTip}><Icon icon="IconShield" size={17} /><p>No compartas este código. Permite vincular una sesión de WhatsApp a tu dispositivo.</p></div>

                </>

              )}

            </section>



            <section id="send" className={`${styles.card} ${styles.messageCard}`}>

              <div className={styles.cardHeader}>

                <div><div className={styles.cardEyebrow}>MENSAJERÍA</div><h2>{messagingMode === 'individual' ? 'Enviar mensaje' : 'Campaña masiva por Excel'}</h2><p>{messagingMode === 'individual' ? 'Redacta un mensaje y envíalo a un número de WhatsApp.' : 'Carga un Excel con tus destinatarios, revisa los números y crea una campaña.'}</p></div>

                <span className={styles.messageHeaderIcon}><Icon icon="IconShield" size={21} /></span>

              </div>



              <div className={campaignStyles.modeSelector} role="tablist" aria-label="Tipo de mensajería">
                <button
                  type="button"
                  role="tab"
                  aria-selected={messagingMode === 'individual'}
                  className={`${campaignStyles.modeButton} ${messagingMode === 'individual' ? campaignStyles.modeButtonActive : ''}`}
                  onClick={() => setMessagingMode('individual')}
                >
                  Enviar mensaje
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={messagingMode === 'campaign'}
                  className={`${campaignStyles.modeButton} ${messagingMode === 'campaign' ? campaignStyles.modeButtonActive : ''}`}
                  onClick={() => setMessagingMode('campaign')}
                >
                  Campaña masiva por Excel
                </button>
              </div>

              {messagingMode === 'individual' ? (
                <>
              <div className={styles.formConnectionNotice}><span className={`${styles.statusDot} ${isReady ? styles.connectedNoticeDot : styles.disconnectedNoticeDot}`} /><span>{isReady ? 'Sesión lista para enviar mensajes' : isAuthenticated ? 'Autenticado; esperando que WhatsApp esté listo' : 'Conecta WhatsApp para habilitar el envío'}</span></div>



              <form className={styles.form} onSubmit={handleSendMessage}>

                <div className={styles.field}>

                  <PhoneInput

                    name='whatsapp-phone'

                    required={true}

                    onChange={(value) => {

                      const event = {

                        target: {

                          name: 'storePhone',

                          value

                        }

                      }

                      return setPhone(event.target.value)

                    }}

                  />

                  <span id="whatsapp-phone-help" className={styles.fieldHint}>Incluye el código de país. Ejemplo para Colombia: 573001234567.</span>

                </div>



                <div className={styles.field}>

                  <div className={styles.labelRow}><label htmlFor="whatsapp-message">Mensaje<span className={styles.requiredMark}>*</span></label><span className={styles.characterCount}>{message.length} caracteres</span></div>

                  <textarea id="whatsapp-message" name="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="¡Hola! ¿Cómo estás? 👋" rows={6} required />

                </div>



                {sendMutation.isSuccess && <div className={styles.successNotice} role="status" aria-live="polite"><span className={styles.feedbackIcon}><Icon icon="IconMiniCheck" size={17} /></span><span>{sendMutation.data?.message ?? 'El backend aceptó la solicitud de envío.'}</span></div>}

                {sendMutation.isError && <div className={styles.errorNotice} role="alert" aria-live="assertive"><span className={styles.feedbackIcon}>!</span><span>{sendMutation.error instanceof Error ? sendMutation.error.message : 'No se pudo enviar el mensaje.'}</span></div>}



                {!isReady && <p className={styles.disabledHint}><Icon icon="IconShield" size={16} />{isAuthenticated ? 'Espera a que el backend informe el estado ready.' : 'Conecta tu cuenta mediante el código QR para habilitar el envío.'}</p>}



                <Button type="submit" primary disabled={!canSend} loading={sendMutation.isPending}>

                 Enviar mensaje

                </Button>

                <div className={styles.formFooter}><Icon icon="IconShield" size={15} /><span>El resultado indica lo que confirmó el backend, no la lectura del destinatario.</span></div>

              </form>
                </>
              ) : (
                <WhatsAppCampaignStepper isReady={isReady} />
              )}

            </section>

          </div>



          <footer className={styles.pageFooter}><span><span className={styles.footerDot} />Panel de WhatsApp</span><span>Conexión y mensajería en un solo lugar</span></footer>

        </div>

      </div>

    </main>

  )

}
