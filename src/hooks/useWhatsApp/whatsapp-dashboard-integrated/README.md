# Integración de campañas Excel en WhatsApp Dashboard

La modificación se realizó sobre el `WhatsAppDashboard.tsx` compartido. La conexión QR, el estado de WhatsApp, las estadísticas, las notificaciones y el formulario individual permanecen. La pestaña de campaña se agrega dentro de la misma tarjeta **MENSAJERÍA**.

## Archivos de la aplicación

- `WhatsAppDashboard.tsx`: dashboard original con un selector nuevo para alternar entre envío individual y campaña.
- `WhatsAppCampaignStepper.tsx`: flujo de dos pasos: subir/validar Excel y configurar/crear campaña.
- `whatsapp-campaign.module.css`: estilos aislados para el selector y el stepper; no reemplaza el `styles.module.css` existente del dashboard.
- `campaignExcel.ts`: lectura de `.xlsx`/`.xls`, detección de teléfonos, validación, deduplicación y descarga de plantilla.

Copia los tres archivos nuevos junto al componente existente y reemplaza el `WhatsAppDashboard.tsx` por la versión incluida. Conserva tu `styles.module.css` original: no hace falta cambiarlo.

Instala la dependencia de lectura de Excel desde la raíz de la app:

```bash
npm install xlsx
```

## Integrar el hook en `npm-pkg-hook`

Dentro del paquete `npm-pkg-hook`, copia los archivos de `npm-pkg-hook/` junto al módulo donde están definidos `whatsappKeys` y los hooks de WhatsApp. Si el layout del paquete ubica los servicios en otra carpeta, ajusta solo las rutas de importación relativas.

Agrega al entrypoint público del paquete (`src/index.ts`, `src/index.ts` de hooks o el que utilice el proyecto) las exportaciones del archivo `npm-pkg-hook/exports-to-add.txt`. Después, compila/publica o enlaza la versión local del paquete para que la app pueda importar `useUploadWhatsAppCampaign` desde `npm-pkg-hook`.

El hook invalida `whatsappKeys.status()` después de crear la campaña y no sustituye los hooks existentes de conexión, QR, estadísticas o mensaje individual.

## Configuración del endpoint

Copia `.env.local.example` a los valores apropiados en `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WHATSAPP_CAMPAIGN_UPLOAD_ENDPOINT=/ruta-real-del-endpoint-de-campanas
```

**Importante:** el mensaje recibido no contenía la documentación concreta del endpoint de campaña. Por eso la URL no se inventa: es obligatoria por variable de entorno. El adaptador multipart incluido envía los campos `file`, `campaignName` y `message`; comprueba que esos nombres y el método `POST` coincidan con el contrato real. Si `npm-pkg-hook` usa un cliente HTTP autenticado compartido, reemplaza `fetch` por esa instancia para respetar sus interceptores, base URL y manejo de errores.

## Comportamiento

1. En **Enviar mensaje**, se conserva el `PhoneInput`, el textarea, la respuesta de la mutación existente y el pie que explica qué confirma el backend.
2. En **Campaña masiva por Excel**, el usuario puede descargar una plantilla con la columna `telefono`, cargar un Excel y revisar filas, números únicos, duplicados y errores.
3. El stepper no permite avanzar si hay teléfonos inválidos ni crear una campaña si la sesión no está lista.
4. En el segundo paso el usuario define el nombre y el mensaje; se envía al endpoint un Excel normalizado y sin duplicados junto con esos datos.
5. El resultado mostrado corresponde a la respuesta del backend; no afirma que el destinatario haya leído el mensaje.

## Contrato provisional de respuesta

El adaptador entiende de forma opcional `message` y `totalRecipients` en la respuesta. Si el endpoint usa otra forma de respuesta, adapta el tipo `WhatsAppCampaignResponse` y el mapeo de éxito según esa documentación.
