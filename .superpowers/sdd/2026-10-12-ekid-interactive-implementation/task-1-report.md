# Task 1 Report — Transport khai báo tools + tool_call + toolResponse

**Trạng thái:** ✅ Hoàn thành
**Nhánh:** `dev` · HEAD trước khi làm: `a77b963`

## Đã làm

### 1. `src/lib/voice/gemini-live.ts`
- `GeminiLiveConfig` thêm `tools?: unknown[]` (bỏ trống → AI Mentor không đổi).
- Thêm 2 type xuất: `ToolFunctionCall { id; name; args }`, `ToolFunctionResponse { name; response }`.
- `GeminiLiveEvent` thêm nhánh `{ type: "tool_call"; data: { functionCalls: ToolFunctionCall[] } }`.
- Lưu `this.tools` trong constructor (chỉ giữ khi mảng có phần tử).
- `sendSetupMessage()`: khi có tools → gắn `setup.tools = [{ functionDeclarations: this.tools }]`.
- `dispatch()`: thay khối `console.log` cũ → map `msg.toolCall.functionCalls` (chuẩn hoá `id/name/args`, mặc định `""`/`{}`) và phát event `tool_call` (bỏ qua khi rỗng).
- Giữ nguyên `sendToolResponse` (đổi tham số sang `ToolFunctionResponse[]`).

### 2. `src/components/voice/useVoiceAssistant.ts`
- Export type `OnToolCall = (calls, respond) => void`.
- `VoiceAssistantConfig` thêm `tools?: unknown[]` và `onToolCall?: OnToolCall`.
- `onToolCallRef` (giữ callback mới nhất, không đưa vào deps của `start()`).
- Truyền `tools` xuống `new GeminiLiveClient({...})`.
- Xử lý event `tool_call`: gọi callback kèm hàm `respond` → `clientRef.current?.sendToolResponse(...)`.
- Trả thêm `sendToolResponse(functionResponses)` từ hook.
- Thêm `config?.tools` vào deps của `start()`.

### 3. `src/components/voice/VoiceAssistant.tsx`
- Thêm prop `tools?: unknown[]` + `onToolCall?: OnToolCall`; nối thẳng xuống `useVoiceAssistant`. UI giữ nguyên 100%.

### 4. Test mới `__tests__/voice-tools.test.ts`
- Mock `WebSocket`, kiểm tra: (a) setup gắn/không gắn `tools`; (b) `toolCall` → event `tool_call` map đúng; (c) bỏ qua `functionCalls` rỗng; (d) `sendToolResponse` gửi đúng khung `toolResponse.functionResponses`.

## Kiểm chứng
- `npx tsc --noEmit` → exit 0, sạch.
- `npm run test` → **8 file / 104 test pass** (gồm transport mới).
- `npm run lint` → exit 0, **0 error** (chỉ còn warning cũ, không phát sinh mới).

## Ràng buộc
- TS strict ✅ · tiếng Việt ✅ · không phá AI Mentor ✅ (mặc định không truyền `tools`/`onToolCall`) · không đổi UI ✅.
