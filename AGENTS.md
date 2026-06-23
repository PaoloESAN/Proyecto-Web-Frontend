# Contexto del Proyecto e Instrucciones para Agentes de IA

## 1. Visión General del Proyecto

Este proyecto es la plataforma FinTech de intercambio de divisas P2P (Peer-to-Peer). Permite a los usuarios realizar operaciones de compra/venta de dinero fiat directamente, eliminando intermediarios bancarios tradicionales. La aplicación actúa como un intermediario puramente informativo para facilitar la publicación de ofertas, el emparejamiento automático (matching), el chat en tiempo real, el intercambio de datos bancarios para transferencias directas P2P (externas a la app), la carga de comprobantes y la resolución de disputas mediante un panel de administración.

> [!IMPORTANT]
> Toda la persistencia de datos y lógica de negocio central (reglas de transacciones, límites y flujos) reside en el backend (.NET Core Web API). El Frontend debe integrarse exclusivamente usando los endpoints y el stack de comunicación provistos (REST + SignalR).

---

## 2. Stack Tecnológico & Skills del Proyecto

Para el desarrollo y mantenimiento del frontend, el agente debe dominar y aplicar las siguientes tecnologías y habilidades ("skills"):

1. **Vue 3 (Composition API) & Nuxt 3 (SSR/Routing)**: Creación de componentes reactivos modulares, layouts consistentes y control de rutas.
2. **Pinia**: Gestión centralizada de estado para la sesión de usuario (tokens JWT), perfiles, alertas activas y transacciones en curso.
3. **Nuxt UI & Tailwind CSS**: Diseño e interfaces visuales coherentes, responsivas y atractivas con soporte para estados interactivos y transiciones fluidas.
4. **Integración de API mediante el composable personalizado `useApi`**:
   - **Uso obligatorio**: Para consumir la API del backend, se **DEBE** utilizar el composable `useApi()` (el cual retorna la instancia `$api` preconfigurada de `$fetch` en el plugin `app/plugins/api.ts`) en lugar de hacer llamadas directas o manuales a `$fetch` o `useFetch`.
   - **Funcionamiento y Token**: Utiliza `$fetch` por debajo e inyecta de forma automática el token JWT guardado de la cookie `auth_token` en la cabecera `Authorization: Bearer <token>` para todos los endpoints protegidos.
   - **Tipado Estricto**: Al realizar llamadas a la API mediante `useApi()`, se **DEBEN** utilizar los tipos de TypeScript definidos en `app/types/` (importados mediante `~/types`) para tipar y mapear correctamente tanto la petición (Request) como la respuesta (Response). Ej: `api<LoginResponse>('/api/auth/login', { body: data })`.
   - **Base URL y Configuración**: La URL base se obtiene dinámicamente de `runtimeConfig.public.apiBase` en nuxt.config.ts (mapeada a la variable de entorno `NUXT_PUBLIC_API_BASE` del archivo `.env`).
   - **Interceptores globales (ya implementados)**:
     - Adjunta automáticamente el token JWT obtenido de la cookie `auth_token` en la cabecera `Authorization: Bearer <token>`.
     - Realiza el **Manejo Centralizado de Códigos HTTP**:
       - `401 Unauthorized`: Limpia la sesión en `useAuthStore()`, elimina la cookie del token y redirige al usuario a `/login`.
       - `403 Forbidden`: Muestra un Toast visual de error indicando la falta de permisos.
       - `500 Internal Server Error`: Muestra un Toast visual notificando el error crítico general en el sistema.
5. **Comunicación en Tiempo Real (SignalR)**:
   - Conexión al hub en `/api/chat` usando `@microsoft/signalr`.
   - Método `JoinRoom(transaccionId)` al entrar a la vista de transacción.
   - Método `SendMessage(transaccionId, contenido)` para enviar mensajes.
   - Escuchar evento `ReceiveMessage` para refrescar la lista de mensajes en caliente.
6. **Manejo de Formularios Multipart (FormData)**:
   - Subida de archivos binarios para KYC (`verify-identity`) y vouchers de transacciones (`voucher`). Las imágenes deben validarse en frontend para ser JPG/PNG y pesar menos de 5MB.
7. **Uso de Skills del Agente (`.agents/...`)**: Es mandatario utilizar y apoyarse en las "skills" y scripts predefinidos (como `nuxt`, `nuxtui` y `frontend design`) en la carpeta `.agents/` ubicada en la raíz del proyecto Frontend.
8. **Validación de Formularios con Zod (Simple)**:
   - Se **DEBE** usar `zod` para validar formularios en el lado del cliente (conectado a `<UForm>` de Nuxt UI).
   - Se debe mantener la validación sencilla y directa (evitando reglas complejas innecesarias), manteniéndola lo más básica posible con mensajes claros en español.
9. **Gestor de Paquetes Obligatorio (pnpm)**:
   - Se **DEBE** utilizar exclusivamente `pnpm` para la instalación de dependencias, ejecución de scripts de compilación (`pnpm run build`), tareas de desarrollo (`pnpm run dev`), generación de tipos (`pnpm exec nuxi prepare`), o cualquier otra tarea de CLI en el proyecto. Está estrictamente prohibido utilizar `npm`, `yarn` o `bun` para evitar inconsistencias con el archivo `pnpm-lock.yaml`.

---

## 3. Reglas de Negocio Críticas

- **Rol Intermediario P2P (Sin Custodia de Fondos)**: La aplicación no almacena, recibe ni custodia dinero. Las transferencias bancarias se realizan de forma externa y directa entre los usuarios de banco a banco (P2P). La app actúa únicamente como facilitador para mostrar la información bancaria de destino/recepción y los comprobantes de pago correspondientes.
- **Límites de Oferta**: Una oferta tiene un `montoTotal` (inventario del usuario) y límites por transacción (`montoMinimo` y `montoMaximo`). El monto mínimo NUNCA puede superar al máximo.
- **Seguridad Transaccional**: El flujo de intercambio bloquea la edición/cancelación. Si una oferta tiene transacciones en estado `Pendiente`, `Pagado` o `Disputa`, no puede ser modificada (`PUT`) ni cancelada/eliminada (`DELETE`).
- **Flujo de Ofertas y Gestión ("Mis Ofertas")**:
  - Cada oferta en estado `"En Proceso"` se asocia con a lo más una transacción/solicitud activa (el emparejamiento es directo de 1 a 1).
  - En la lista de ofertas del usuario (`MyOffersScreen`), se ocultan las ofertas en estado `"Finalizada"`, mostrando únicamente las ofertas con estado `"Activa"` y `"En Proceso"`.
  - La edición y eliminación de una oferta solo está permitida si está en estado `"Activa"`. El flujo se realiza haciendo clic sobre la tarjeta de la oferta para abrir un modal de edición. Dicho modal contiene el botón de "Eliminar Oferta", el cual solicita confirmación a través de un diálogo adicional.
- **Ciclo de Transacciones (Doble Confirmación)**:
  1. `Pendiente`: Comprador inicia la transacción seleccionando su cuenta de recepción. Ambos participantes ven sus cuentas cruzadas.
  2. `Pagado` / `Confirmación Parcial`: Ambos participantes deben realizar sus transferencias cruzadas y subir sus respectivos comprobantes de pago (`POST /api/transacciones/:id/voucher`).
  3. `Finalizado` o `Disputa`: Ambos participantes deben verificar el comprobante de la contraparte y presionar "Confirmar Pago Correcto" (`POST /api/transacciones/:id/confirm`). Solo cuando ambos confirman (`confirmadoComprador == true` y `confirmadoVendedor == true`), la transacción pasa a estado `Finalizado`. Cualquiera de las partes puede abrir un conflicto (`Disputa`) antes de confirmar.
- **Resolución de Disputas**: Exclusivo para administradores. La resolución es binaria en cuanto al estado informativo de la transacción dentro del sistema:
  - **A favor del comprador**: La transacción se cambia a estado `Cancelado` y la oferta vuelve a estar `Activa` (disponible para recibir solicitudes de intercambio).
  - **A favor del vendedor**: La transacción se cambia a estado `Finalizado` (la transacción se marca como completada de forma definitiva en el sistema).
- **Calificación del Usuario**: Cada usuario posee un atributo `calificacion` (promedio del 1.00 al 5.00) en la tabla `usuarios`. Este promedio se actualiza de forma automática cada vez que otro usuario registra una nueva calificación para él (`POST /api/calificaciones`).

---

## 4. Mapa de Endpoints e Interfaces TypeScript

> [!IMPORTANT]
> Todas las interfaces TypeScript descritas a continuación ya se encuentran creadas y organizadas en la carpeta `app/types/` (indexadas y exportadas mediante `app/types/index.ts`). Cualquier agente de IA o desarrollador frontend **DEBE** importar y utilizar estas interfaces (ej. `import type { LoginRequest } from '~/types'`) para asegurar la consistencia del tipado en componentes, stores y llamadas a la API (`useFetch` / `$fetch`).

A continuación se especifican las interfaces TypeScript y las respuestas esperadas para cada endpoint de la API base desplegada en `http://localhost:5132`.

### Respuestas de Error Comunes

```typescript
export interface ErrorResponse {
  mensaje: string;
}
```

---

### A. Autenticación (Auth)

#### `POST /api/auth/login`

- **Público**
- **Request Body**:
  ```typescript
  export interface LoginRequest {
    correo: string; // Requerido, formato email válido
    password: string; // Requerido
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface LoginResponse {
      token: string;
      expiracion: string; // ISO Date String
      usuario: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        rol: "Usuario" | "Administrador";
        esVerificado: boolean;
        fotoPerfilUrl: string | null;
      };
    }
    ```
  - `401 Unauthorized`: `ErrorResponse` (Credenciales incorrectas o usuario inactivo/suspendido).

#### `POST /api/auth/register`

- **Público**
- **Request Body**:
  ```typescript
  export interface RegisterRequest {
    nombres: string; // Máx 100
    apellidos: string; // Máx 100
    correo: string; // Máx 150, formato email válido
    password: string; // Mín 6, máx 255
    confirmarPassword: string; // Debe ser igual a password
  }
  ```
- **Respuestas**:
  - `201 Created`:
    ```typescript
    export interface RegisterResponse {
      mensaje: string; // "Usuario registrado exitosamente"
      usuario: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        rol: string;
        estado: string; // "Activo"
        esVerificado: boolean;
        fotoPerfilUrl: string | null;
      };
    }
    ```
  - `400 Bad Request`: `ErrorResponse` (Errores de validación o contraseña no coincide).

#### `POST /api/auth/recover-password`

- **Público**
- **Request Body**:
  ```typescript
  export interface RecoverPasswordRequest {
    correo: string;
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MessageResponse {
      mensaje: string; // "Se ha enviado un enlace de recuperación..."
    }
    ```
  - `404 Not Found`: `ErrorResponse` (El correo no se encuentra registrado).
  - `400 Bad Request`: `ErrorResponse`.

#### `POST /api/auth/reset-password`

- **Público**
- **Request Body**:
  ```typescript
  export interface ResetPasswordRequest {
    token: string;
    password: string; // Mín 6
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MessageResponse {
      mensaje: string; // "Contraseña restablecida exitosamente"
    }
    ```
  - `400 Bad Request`: `ErrorResponse`.

---

### B. Usuarios (Users) & KYC

#### `GET /api/users/profile`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface UserProfileResponse {
      usuarioId: number;
      nombres: string;
      apellidos: string;
      correo: string;
      rol: string;
      estado: string;
      fechaRegistro: string;
      esVerificado: boolean;
      calificacion: number;
      fotoPerfilUrl: string | null;
    }
    ```
  - `401 Unauthorized` / `404 Not Found`.

#### `PUT /api/users/profile`

- **Requiere Auth** (Multipart/Form-Data)
- **Request Body** (FormData):
  - `nombres`: string (Requerido, máx 100)
  - `fotoPerfil`?: File (Opcional, imagen <= 5MB)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface UpdateProfileResponse {
      mensaje: string; // "Perfil actualizado exitosamente"
      usuario: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        rol: string;
        fotoPerfilUrl: string | null;
      };
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `404 Not Found`.

#### `GET /api/users/metodos-pago`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MetodoPagoResponse {
      metodoPagoId: number;
      banco: string;
      numeroCuenta: string;
      nombreTitular: string;
      tipoMoneda: string;
      estado: string;
      fechaCreacion: string;
    }
    [];
    ```
  - `401 Unauthorized`.

#### `POST /api/users/metodos-pago`

- **Requiere Auth**
- **Request Body**:
  ```typescript
  export interface MetodoPagoCreateRequest {
    banco: string;
    numeroCuenta: string;
    nombreTitular: string;
    tipoMoneda: string; // Ej: "USD", "PEN"
  }
  ```
- **Respuestas**:
  - `201 Created`:
    ```typescript
    export interface MetodoPagoCreateResponse {
      mensaje: string; // "Método de pago registrado exitosamente"
      metodoPago: {
        metodoPagoId: number;
        banco: string;
        numeroCuenta: string;
        nombreTitular: string;
        tipoMoneda: string;
        estado: string;
        fechaCreacion: string;
      };
    }
    ```
  - `400 Bad Request` / `401 Unauthorized`.

#### `DELETE /api/users/metodos-pago/:id`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MessageResponse {
      mensaje: string; // "Método de pago eliminado exitosamente"
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `404 Not Found`.

#### `POST /api/users/verify-identity`

- **Requiere Auth** (Multipart/Form-Data)
- **Request Body** (FormData):
  - `dniFrontal`: File (Imagen <= 5MB)
  - `dniPosterior`: File (Imagen <= 5MB)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface VerifyIdentityResponse {
      mensaje: string; // "Identidad verificada exitosamente..."
      dniFrontalUrl: string;
      dniPosteriorUrl: string;
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `404 Not Found` / `500 Internal Server Error`.

---

### C. Ofertas (Offers)

#### `POST /api/ofertas`

- **Requiere Auth**
- **Request Body**:
  ```typescript
  export interface OfertaCreateRequest {
    metodoPagoId: number;
    tipoOperacion: "Compra" | "Venta";
    moneda: string; // Ej: "USD", "PEN"
    montoTotal: number; // > 0
    montoMinimo: number; // > 0
    montoMaximo: number; // > 0, >= montoMinimo
    tipoCambio: number; // > 0
  }
  ```
- **Respuestas**:
  - `201 Created`:
    ```typescript
    export interface OfertaResponse {
      ofertaId: number;
      usuarioCreadorId: number;
      metodoPagoId: number;
      tipoOperacion: "Compra" | "Venta";
      moneda: string;
      montoTotal: number;
      montoMinimo: number;
      montoMaximo: number;
      tipoCambio: number;
      estado: string; // "Activa"
      fechaPublicacion: string;
    }
    ```
  - `400 Bad Request` / `401 Unauthorized`.

#### `GET /api/ofertas`

- **Público** (Muestra ofertas en estado "Activa" y "En Proceso")
- **Query Parameters**:
  - `moneda`?: string
  - `tipoOperacion`?: "Compra" | "Venta"
  - `monto`?: number
  - `page`?: number (Default: 1)
  - `pageSize`?: number (Default: 10)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface GetOffersResponse {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      datos: {
        ofertaId: number;
        tipoOperacion: "Compra" | "Venta";
        moneda: string;
        montoTotal: number;
        montoMinimo: number;
        montoMaximo: number;
        tipoCambio: number;
        estado: string;
        fechaPublicacion: string;
        metodoPago: {
          metodoPagoId: number;
          banco: string;
          nombreTitular: string;
          numeroCuenta: string;
          tipoMoneda: string;
        };
        usuarioCreador: {
          usuarioId: number;
          nombres: string;
          apellidos: string;
          correo: string;
          calificacion: number;
          fotoPerfilUrl: string | null;
        };
      }[];
    }
    ```

#### `GET /api/ofertas/marketplace`

- **Requiere Auth** (Muestra ofertas en estado "Activa" y "En Proceso" de otros usuarios, excluyendo las del usuario autenticado que realiza la consulta)
- **Query Parameters**:
  - `moneda`?: string
  - `tipoOperacion`?: "Compra" | "Venta"
  - `monto`?: number
  - `page`?: number (Default: 1)
  - `pageSize`?: number (Default: 10)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface GetMarketplaceOffersResponse {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      datos: {
        ofertaId: number;
        tipoOperacion: "Compra" | "Venta";
        moneda: string;
        montoTotal: number;
        montoMinimo: number;
        montoMaximo: number;
        tipoCambio: number;
        estado: string;
        fechaPublicacion: string;
        metodoPago: {
          metodoPagoId: number;
          banco: string;
          nombreTitular: string;
          numeroCuenta: string;
          tipoMoneda: string;
        } | null;
        usuarioCreador: {
          usuarioId: number;
          nombres: string;
          apellidos: string;
          correo: string;
          calificacion: number;
          fotoPerfilUrl: string | null;
        } | null;
      }[];
    }
    ```
  - `401 Unauthorized`.

#### `GET /api/ofertas/:id`

- **Público**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface OfertaDetalleResponse {
      ofertaId: number;
      tipoOperacion: "Compra" | "Venta";
      moneda: string;
      montoTotal: number;
      montoMinimo: number;
      montoMaximo: number;
      tipoCambio: number;
      estado: string;
      fechaPublicacion: string;
      metodoPago: {
        metodoPagoId: number;
        banco: string;
        nombreTitular: string;
        numeroCuenta: string;
        tipoMoneda: string;
      } | null;
      usuarioCreador: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        calificacion: number;
        fotoPerfilUrl: string | null;
      } | null;
    }
    ```
  - `404 Not Found`: `ErrorResponse` (La oferta especificada no existe).

#### `GET /api/ofertas/matches`

- **Requiere Auth** (Busca ofertas de otros usuarios compatibles con la oferta seleccionada por el usuario autenticado)
- **Query Parameters**:
  - `ofertaId`: number (Requerido)
- **Respuestas**:
  - `200 OK`: Array de ofertas coincidentes.
    ```typescript
    export type MatchesResponse = {
      ofertaId: number;
      tipoOperacion: string;
      moneda: string;
      montoTotal: number;
      montoMinimo: number;
      montoMaximo: number;
      tipoCambio: number;
      estado: string;
      fechaPublicacion: string;
      metodoPago: {
        metodoPagoId: number;
        banco: string;
        nombreTitular: string;
        numeroCuenta: string;
        tipoMoneda: string;
      };
      usuarioCreador: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        calificacion: number;
      };
    }[];
    ```
  - `400 Bad Request` / `401 Unauthorized`.

#### `PUT /api/ofertas/:id`

- **Requiere Auth**
- **Request Body** (Importante: Propiedades en snake_case):
  ```typescript
  export interface OfertaUpdateRequest {
    monto_total: number;
    monto_minimo: number;
    monto_maximo: number;
    tipo_cambio: number;
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MessageResponse {
      mensaje: string; // "Oferta modificada con éxito."
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden`.

#### `DELETE /api/ofertas/:id`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MessageResponse {
      mensaje: string; // "Oferta cancelada con éxito."
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden`.

#### `GET /api/ofertas/usuario`

- **Requiere Auth** (Muestra las ofertas del usuario autenticado en estado "Activa" o "En Proceso")
- **Respuestas**:
  - `200 OK`: Array de ofertas propias del usuario.
    ```typescript
    export type UsuarioOfertasResponse = {
      ofertaId: number;
      tipoOperacion: "Compra" | "Venta";
      moneda: string;
      montoTotal: number;
      montoMinimo: number;
      montoMaximo: number;
      tipoCambio: number;
      estado: string; // "Activa" | "En Proceso"
      fechaPublicacion: string;
      metodoPago: {
        metodoPagoId: number;
        banco: string;
        nombreTitular: string;
        numeroCuenta: string;
        tipoMoneda: string;
      } | null;
    }[];
    ```
  - `401 Unauthorized`.

---

### D. Transacciones (Transactions)

#### `POST /api/transacciones`

- **Requiere Auth**
- **Request Body**:
  ```typescript
  export interface TransaccionCreateRequest {
    ofertaId: number;
    montoOperacion: number; // Debe cumplir los límites de la oferta
    metodoPagoCompradorId: number; // Cuenta bancaria seleccionada por el comprador
  }
  ```
- **Respuestas**:
  - `201 Created`:
    ```typescript
    export interface TransaccionCreateResponse {
      mensaje: string; // "Transacción iniciada exitosamente"
      transaccion: {
        transaccionId: number;
        ofertaId: number;
        usuarioCompradorId: number;
        usuarioVendedorId: number;
        metodoPagoCompradorId: number;
        montoOperacion: number;
        tipoCambioAplicado: number;
        estado: "Pendiente";
        fechaInicio: string;
        fechaActualizacion: string;
      };
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `500 Internal Server Error`.

#### `GET /api/transacciones/history`

- **Requiere Auth**
- **Query Parameters**:
  - `estado`?: "Pendiente" | "Pagado" | "Finalizado" | "Disputa" | "Cancelado"
  - `page`?: number (Default: 1)
  - `pageSize`?: number (Default: 10)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface TransaccionHistoryResponse {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      datos: {
        transaccionId: number;
        ofertaId: number;
        tipoOperacion: "Compra" | "Venta";
        moneda: string;
        montoOperacion: number;
        tipoCambioAplicado: number;
        estado: string;
        fechaInicio: string;
        fechaActualizacion: string;
        miRol: "Comprador" | "Vendedor";
        contraparte: {
          usuarioId: number;
          nombres: string;
          apellidos: string;
        };
        yaCalificado: boolean;
      }[];
    }
    ```
  - `401 Unauthorized`.

#### `GET /api/transacciones/:id`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface TransaccionDetailResponse {
      transaccionId: number;
      ofertaId: number;
      montoOperacion: number;
      tipoCambioAplicado: number;
      estado: string; // "Pendiente" | "Pagado" | "Finalizado" | "Disputa" | "Cancelado"
      fechaInicio: string;
      fechaActualizacion: string;
      comprador: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
      };
      vendedor: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
      };
      instruccionesPago: {
        banco: string;
        numeroCuenta: string;
        nombreTitular: string;
        tipoMoneda: string;
      };
      metodoPagoComprador: {
        banco: string;
        numeroCuenta: string;
        nombreTitular: string;
        tipoMoneda: string;
      } | null;
      comprobantes?: {
        comprobanteId: number;
        usuarioId: number;
        imagenUrl: string;
        fechaSubida: string;
      }[];
      confirmadoComprador: boolean;
      confirmadoVendedor: boolean;
      yaCalificado: boolean;
    }
    ```
  - `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

#### `GET /api/transacciones/:id/messages`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface MensajeChatResponse {
      mensajeId: number;
      transaccionId: number;
      remitenteId: number;
      contenido: string;
      fechaEnvio: string;
    }
    [];
    ```
  - `401 Unauthorized` / `403 Forbidden`.

#### `POST /api/transacciones/:id/confirm`

- **Requiere Auth** (Ambos participantes)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface ConfirmReceiptResponse {
      mensaje: string; // "Confirmación registrada exitosamente..."
      transaccionId: number;
      estado: string; // "Pendiente" | "Pagado" | "Finalizado"
      confirmadoComprador: boolean;
      confirmadoVendedor: boolean;
      fechaActualizacion: string;
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

#### `POST /api/transacciones/:id/dispute`

- **Requiere Auth** (Cualquier participante)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface OpenDisputeResponse {
      mensaje: string; // "Disputa abierta correctamente"
      disputa: {
        disputaId: number;
        transaccionId: number;
        estado: "Abierta";
        fechaApertura: string;
      };
    }
    ```
  - `400 Bad Request` (Transacción no está en 'Pagado') / `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

#### `POST /api/transacciones/:id/voucher`

- **Requiere Auth** (Solo Comprador, Multipart/Form-Data)
- **Request Body** (FormData):
  - `file`: File (Imagen del comprobante <= 5MB)
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface UploadVoucherResponse {
      mensaje: string; // "Voucher subido exitosamente..."
      urlVoucher: string;
      estado: "Pagado";
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found` / `500 Internal Server Error`.

---

### E. Alertas & Calificaciones

#### `POST /api/alertas`

- **Requiere Auth**
- **Request Body**:
  ```typescript
  export interface AlertaCreateRequest {
    moneda: string; // Exactamente 3 caracteres. Ej: "USD"
    tipoCambioDeseado: number; // > 0
  }
  ```
- **Respuestas**:
  - `201 Created`:
    ```typescript
    export interface AlertaCreateResponse {
      mensaje: string; // "Alerta creada exitosamente."
    }
    ```
  - `400 Bad Request` / `401 Unauthorized`.

#### `GET /api/alertas`

- **Requiere Auth**
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface AlertaResponse {
      alertaId: number;
      usuarioId: number;
      moneda: string;
      tipoCambioDeseado: number;
      estado: "Activa" | "Inactiva";
      fechaCreacion: string;
    }
    [];
    ```
  - `401 Unauthorized`.

#### `DELETE /api/alertas/:id`

- **Requiere Auth**
- **Respuestas**:
  - `204 No Content` (Eliminación exitosa sin cuerpo)
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden`.

#### `POST /api/calificaciones`

- **Requiere Auth**
- **Request Body**:
  ```typescript
  export interface CalificacionCreateRequest {
    transaccionId: number;
    puntaje: number; // Rango 1 - 5
    comentario?: string; // Máx 500, opcional
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface CalificacionResponse {
      mensaje: string;
      calificacion: {
        calificacionId: number;
        transaccionId: number;
        puntaje: number;
        comentario: string | null;
        fechaCalificacion: string;
      };
    }
    ```
  - `400 Bad Request` (Transacción no finalizada o ya calificada) / `401 Unauthorized` / `403 Forbidden`.

---

### F. Administración (Admin - Requiere Rol "Administrador")

#### `GET /api/admin/users`

- **Requiere Auth & Rol Admin**
- **Query Parameters**:
  - `search`?: string
  - `estado`?: string
  - `page`?: number
  - `pageSize`?: number
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface GetUsersAdminResponse {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      datos: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        rol: string;
        estado: string;
        fechaRegistro: string;
        esVerificado: boolean;
      }[];
    }
    ```
  - `401 Unauthorized` / `403 Forbidden`.

#### `PUT /api/admin/users/:id/status`

- **Requiere Auth & Rol Admin**
- **Request Body**:
  ```typescript
  export interface UpdateUserStatusRequest {
    estado: "Activo" | "Suspendido" | "Bloqueado";
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface UpdateUserStatusResponse {
      mensaje: string;
      usuario: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
        estado: string;
      };
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

#### `GET /api/admin/disputes`

- **Requiere Auth & Rol Admin**
- **Query Parameters**:
  - `estado`?: "Abierta" | "Resuelta"
  - `page`?: number
  - `pageSize`?: number
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface GetDisputesAdminResponse {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      datos: {
        disputaId: number;
        estado: "Abierta" | "Resuelta";
        resolucion: string | null;
        fechaApertura: string;
        fechaCierre: string | null;
        transaccion: {
          transaccionId: number;
          montoOperacion: number;
          tipoCambioAplicado: number;
          estadoTx: string;
          fechaInicio: string;
          comprador: {
            usuarioId: number;
            nombres: string;
            apellidos: string;
            correo: string;
          };
          vendedor: {
            usuarioId: number;
            nombres: string;
            apellidos: string;
            correo: string;
          };
          comprobantes: {
            comprobanteId: number;
            imagenUrl: string;
            fechaSubida: string;
          }[];
        };
        usuarioReportador: {
          usuarioId: number;
          nombres: string;
          apellidos: string;
          correo: string;
        };
      }[];
    }
    ```
  - `401 Unauthorized` / `403 Forbidden`.

#### `POST /api/admin/disputes/:id/resolve`

- **Requiere Auth & Rol Admin**
- **Request Body**:
  ```typescript
  export interface ResolveDisputeRequest {
    resolucion: "A favor del comprador" | "A favor del vendedor";
  }
  ```
- **Respuestas**:
  - `200 OK`:
    ```typescript
    export interface ResolveDisputeResponse {
      mensaje: string; // "Disputa resuelta correctamente"
      disputa: {
        disputaId: number;
        estado: "Resuelta";
        resolucion: "A favor del comprador" | "A favor del vendedor";
        fechaApertura: string;
        fechaCierre: string;
      };
      transaccion: {
        transaccionId: number;
        estado: "Cancelado" | "Finalizado";
      };
      oferta: {
        ofertaId: number;
        estado: "Activa" | string;
      };
    }
    ```
  - `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found` / `500 Internal Server Error`.

---

## 5. Integración del Chat en Tiempo Real (SignalR)

El Frontend debe habilitar una comunicación interactiva instantánea en la vista detallada de la transacción.

- **Ruta de Conexión del Hub**: `/api/chat` (ej: `http://localhost:5132/api/chat`)
- **Habilidades requeridas del Cliente (Vue/Nuxt)**:
  1. Conectar adjuntando el token JWT en las opciones de conexión (`accessTokenFactory`).
  2. Invocar `JoinRoom(transaccionId)` enviando el ID de la transacción como parámetro de texto al establecer la conexión.
  3. Emitir mensajes enviando `SendMessage(transaccionId, contenido)`.
  4. Suscribirse al evento `ReceiveMessage` para capturar la llegada de nuevos chats del canal:
     ```typescript
     interface ChatMessageReceived {
       mensajeId: number;
       transaccionId: number;
       remitenteId: number;
       contenido: string;
       fechaEnvio: string;
     }
     ```

---

## 6. Flujo de Transacción P2P, Cuentas Bancarias Cruzadas y Doble Confirmación

La vista detallada de la transacción (`app/pages/transaction/[id].vue`) implementa un flujo interactivo estructurado y seguro para ambas partes:

### A. Cuentas Bancarias Cruzadas
Para facilitar el intercambio sin confusiones sobre a dónde enviar el dinero, el sistema calcula y muestra de forma cruzada las cuentas:
1. **Cuenta Destino (Enviar Pago)**: Representa la cuenta bancaria de la **contraparte**. El usuario actual debe transferir fondos a este banco, número de cuenta y titular.
2. **Tu Cuenta de Recepción (Recibir Pago)**: Representa la cuenta del **usuario actual** configurada para esta transacción. Es el destino donde la contraparte depositará los fondos del intercambio.

### B. Desglose de Montos Exactos
La interfaz de usuario calcula dinámicamente:
* **Monto a Enviar**: En la moneda destino, aplicando el tipo de cambio pactado en la oferta si la divisa es distinta al activo base.
* **Monto a Recibir**: El monto y divisa esperada en la cuenta receptora del usuario.
Esto asegura que ambos usuarios sepan exactamente cuántas unidades de fiat enviar y recibir.

### C. Flujo de Doble Confirmación y Voucher
1. **Envío de Comprobante**: Ambas partes deben realizar su transferencia correspondiente y subir su comprobante de pago (`POST /api/transacciones/:id/voucher`).
2. **Habilitación de Confirmación**: El botón **"Confirmar Pago Correcto"** (`POST /api/transacciones/:id/confirm`) está estrictamente condicionado a que la contraparte ya haya subido su comprobante (`contraparteVoucher !== null`). Si no lo ha hecho, se muestra un banner de advertencia animando a esperar. Esto previene liberaciones accidentales de fondos antes de verificar el recibo.
3. **Mecanismo de Disputa**: El botón **"Abrir Disputa"** permanece habilitado e interactivo en todo momento si surge algún inconveniente, y cuenta con un **Modal de Confirmación** para evitar aperturas accidentales.
