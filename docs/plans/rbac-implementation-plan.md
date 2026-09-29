# خطة تنفيذ تكامل API مداد — إصدار الأدوار والصلاحيات (RBAC)

> **المرجع:** `api/API_INTEGRATION.md` (دليل التكامل لمطوّر React — النسخة الثالثة).
> **الفرع:** `develop` · **تاريخ التحليل:** 2026-09-28 · **الحالة:** جاهزة للتنفيذ.
> **القواعد الحاكمة:** `CLAUDE.md` في جذر المشروع (المعمارية الحالية عقد ملزم؛ أصغر تغيير صحيح؛ لا تبعيات جديدة دون موافقة؛ واجهة عربية RTL فقط).

---

## حالة التنفيذ (2026-09-28): منفّذة بالكامل

**نتائج المرحلة 0 على الـ Backend الحي:**

- A1: `creator.role` كائن `{ id, name, builtIn }` كما في القسم 5.
- A4: رسائل `403` و`409` إنجليزية، فالواجهة تعرض نصوصاً عربية ثابتة. رسالة آخر مدير تحتوي `is the last`.
- الحساب المعطّل يعيد `401 User is disabled` عند الدخول، وعند أي طلب بتوكن قديم، وعند التجديد.

**انحرافات عن الخطة:**

- **آخر commit في الـ Backend (`40b349e`)** جعل `reportDate` مطلوباً دائماً، و`crimePlace` و`crimeDate` مطلوبين متى اختير نوع جرم. أُضيفت القاعدتان إلى `report-form-schema.ts`، وتاريخ الضبط يبدأ بتاريخ اليوم.
- **`staleTime` للجلسة 60 ثانية لا 5 دقائق** (D1)، لأن الاختبار أظهر أن 5 دقائق تؤخر ظهور صلاحية ممنوحة عند العودة للتبويب.
- **`npm run typecheck` و`npm run build` لم يكونا يفحصان شيئاً:** `tsconfig.json` الجذر فيه `"files": []`. صارا يفحصان `tsconfig.app.json` و`tsconfig.node.json`، وأُصلحت 27 مشكلة أنواع كانت مخفية (منها 23 في `lib/dictation`).
- `FormField` أخذ خاصية `hint` اختيارية لتلميح «لا تملك صلاحية استعراض أنواع الجرم».

**تحديث دليل الـ API (النسخة 4، commit `55bc034`):** `GET /roles/options` صار يعيد لكل خانة من الخانات العشرين `description` و`requires`. محرر الأدوار يعرض الوصف (تلميحاً، وفي لوحة تحت الجدول للخانة المحددة) ويبني التبعيات من `requires` بدل قواعد مثبّتة في الواجهة؛ والخانة المطلوبة لخانة مفعّلة تبقى محددة ومقفلة مع سببها. رسائل `403` في كل الـ mutations صارت «ليس لديك صلاحية لتنفيذ هذا الإجراء.» (`lib/api/errors.ts`). رسائل أخطاء الـ Backend ما زالت إنجليزية، فتبقى الواجهة على نصوصها العربية بدل عرضها «كما هي».

**التحقق:** `typecheck` و`lint` (صفر تحذيرات) و`build` ناجحة. السيناريوهات T1، T2، T3، T5، T6، T7، T8، T9، T10، T11، T13 اختُبرت في Chrome حقيقي (headless) مقابل الـ Backend بثلاثة حسابات. T4 وT14 تحققتا بمراجعة الكود فقط. **T12 وT15 لم تُختبرا.**

---

## 0. الملخص التنفيذي

قارنتُ دليل الـ API بالكود الحالي سطراً بسطر. **معظم الدليل منفّذ فعلاً**: التقارير بحقولها الجديدة، الختم (`CLOSED`)، تغيير النتيجة بـ`PATCH`، أنواع النماذج بشجرتها، أنواع الجرم، القوالب وملف الـ PDF الخاص بها، الإحصائيات مع `details`، تصدير Excel، وتجديد التوكن عند `401`. كذلك أُصلحت مشكلة CORS بإزالة `credentials: 'include'`، كما يطلب الدليل.

**الفجوة الحقيقية واحدة لكنها تمسّ التطبيق كله:** الـ Backend انتقل من دورين ثابتين (`'ADMIN' | 'USER'`) إلى **نظام أدوار وصلاحيات ديناميكي**:

- صار `role` كائناً `{ id, name, builtIn }` بعد أن كان نصاً.
- الصلاحيات تصل في `permissions` بالشكل `Record<Resource, Action[]>`.
- أُضيفت إدارة الأدوار (`/roles`)، وإدارة المستخدمين الكاملة (`POST /users`، `PUT /users/{id}/role`، `PUT /users/{id}/enabled`)، وتعطيل الحسابات.

الكود الحالي يفترض الدورين القديمين في **14 ملفاً** (حرّاس المسارات، الشريط الجانبي، الأزرار، التسميات). بعد نشر الـ Backend الجديد:

- ستظهر تسمية الدور فارغة، لأن `ROLE_LABELS[{...}]` يعيد `undefined`.
- سيُعامَل **كل مستخدم كغير مدير**، لأن `role === 'ADMIN'` تصبح `false` دائماً، فيختفي الـ Dashboard عن الجميع.
- الكوكي المخزّن قديم الشكل.

**لذلك هذه الخطة ليست إضافة ميزة، بل ترحيل إلزامي** قبل أو مع نشر الـ Backend.

التقدير: 8 مراحل، كلٌّ منها قابلة للدمج والتحقق باستقلال، بحجم إجمالي يقارب 25–30 ملفاً.

---

## 1. لقطة الوضع الحالي

| الطبقة | الموجود | الملاحظة |
|---|---|---|
| عميل HTTP | `src/lib/api/client.ts` مبني على `fetch`، ويجدّد التوكن مرة واحدة عند `401` ثم يعيد المحاولة، ويخرج المستخدم إن فشل التجديد | متوافق مع القسم 2.4. لا يعالج `User is disabled` برسالة خاصة |
| الجلسة | كوكيز: التوكن، والتوكن المجدِّد، و`medad_session_user` (JSON للمستخدم) | يخزّن `role` كنص. تعليقاته تقول «لا يوجد `/auth/me`»، وهذا لم يعد صحيحاً (`GET /users/me` موجود ويرجع `permissions`) |
| مصدر هوية المستخدم | `useSession()` يقرأ الكوكي فقط (`staleTime: Infinity`) | لا يتزامن مع الـ Backend أبداً، فتغيير الصلاحيات لا يصل للواجهة |
| التفويض | `RequireRole allowedRoles={['ADMIN']}` + فحوص `role === 'ADMIN'` متفرقة | يجب استبداله بفحص صلاحيات |
| المستخدمون | صفحة موجودة لكنها **مطفأة** (`FEATURES.usersPage = false`)، والإنشاء عبر `/auth/register` بلا اختيار دور | ينقصها: إسناد الدور، التفعيل والتعطيل، الإنشاء عبر `POST /users` |
| الأدوار | لا شيء | ميزة جديدة كاملة |
| البنية التحتية للاختبار | لا يوجد (`test/` فارغ) | التحقق عبر `typecheck` و`lint` و`build` واختبار يدوي منظّم |
| مكوّنات UI | يوجد `switch` و`select` و`dropdown-select` و`confirm-dialog` و`dialog` و`table` | **لا يوجد `checkbox`**، وهو لازم لمصفوفة الصلاحيات |

---

## 2. تحليل الفجوات (الدليل مقابل الكود)

| # | البند | قسم الدليل | الحالة | ملفات متأثرة |
|---|---|---|---|---|
| G1 | CORS بلا `withCredentials` | 1 | ✅ منفّذ | `lib/api/client.ts` |
| G2 | تجديد التوكن عند 401 مرة واحدة | 2.3، 2.4 | ✅ منفّذ | `lib/api/client.ts` |
| G3 | **`role` كائن + `permissions`** في الدخول و`/users/me` | 2.2، 4.2، 5 | ❌ | `types/auth.ts`، `types/user.ts`، `hooks/auth/use-login.ts`، `lib/session/session.ts` |
| G4 | **مزامنة الصلاحيات أثناء الجلسة** (تسري فوراً في الـ Backend) | 4.2 | ❌ | `hooks/auth/use-session.ts`، `lib/query/query-client.ts` |
| G5 | **حرّاس المسارات بالصلاحية** بدل الدور | 4، 4.4 | ❌ | `components/auth/require-role.tsx`، `routes/route-config.tsx` |
| G6 | **إظهار وإخفاء الأزرار والروابط بالصلاحية** | 4.2 | ❌ | جدول «المكوّنات» في القسم 6 |
| G7 | **إدارة الأدوار** `/roles` (CRUD + options + مصفوفة) | 4.5 | ❌ ميزة جديدة | جديد: `types/role.ts`، `lib/roles/api.ts`، `hooks/roles/*`، `components/roles/*`، `pages/roles/*` |
| G8 | **إنشاء مستخدم بدور** `POST /users` | 5 | ❌ | `lib/users/api.ts`، `hooks/users/use-create-user.ts`، `create-user-dialog.tsx` |
| G9 | **تغيير دور مستخدم** `PUT /users/{id}/role` | 5 | ❌ | جديد: hook + dialog |
| G10 | **تعطيل وتفعيل حساب** `PUT /users/{id}/enabled` | 5 | ❌ | `users-table.tsx` + hook |
| G11 | رسالة «الحساب معطّل» (`401 User is disabled`) | 2.4، 11 | ❌ | `hooks/auth/use-login.ts`، `lib/api/client.ts` |
| G12 | قواعد منع التصعيد (`403`) وآخر مدير (`409`) برسائل عربية واضحة | 3، 4.3 | ⚠️ جزئي | hooks المستخدمين والأدوار |
| G13 | `/auth/register` لم يعد عاماً | 2.1، 11 | ✅ لا يوجد رابط تسجيل في صفحة الدخول | — |
| G14 | أنواع المعرّفات: `id` رقم في الدليل، ونص (`string`) في `types/user.ts` و`types/auth.ts` | 8 | ⚠️ تناقض أنواع | `types/*`، `lib/users/api.ts`، `query-keys.ts`، `ReportFilterParams.creatorId` |
| G15 | شاشات تعتمد على قوائم تحتاج صلاحيات أخرى (4.4) | 4.4 | ❌ ستفشل بـ`403` | `dashboard-page.tsx` (`useUsers`)، `report-filters.tsx` (`useUsers`)، `report-form.tsx` (`useCrimeTypes`) |
| G16 | التقارير (الحقول، الختم، PATCH، PDF، Excel) | 7.x | ✅ منفّذ | — |
| G17 | أنواع النماذج والقوالب وPDF القالب | 6.x | ✅ منفّذ | — |
| G18 | الإحصائيات مع `details` | 7.7 | ✅ منفّذ | — |

> **G15 خطر صامت:** دور «مستخدم» الافتراضي يملك `USERS:VIEW`، لكن أي دور مخصص بدونها سيجعل `report-filters.tsx` يفشل، وسيُسقط **الـ Dashboard كاملاً**، لأن `isError` هناك يجمع حالات الاستعلامات الثلاثة.

---

## 3. القرارات المعمارية

### D1 — مصدر الحقيقة لهوية المستخدم وصلاحياته: `GET /users/me`

- **القرار:** يصبح `useSession()` استعلاماً حقيقياً على `GET /users/me`، ويستخدم الكوكي `initialData` فقط، حتى يبقى العرض الأول فورياً ولا يومض المحتوى عند إعادة التحميل.
- **السبب:** الدليل (4.2) صريح: «الـ Backend يقرأ صلاحيات الدور مع كل طلب… الواجهة لا تعرف بذلك حتى تعيد جلب `/users/me`». أما `staleTime: Infinity` الحالي فيجعل الواجهة عمياء عن أي تغيير.
- **التفاصيل:**
  - `queryFn`: إن لم يوجد توكن يعيد `null`، وإلا يستدعي `me()` ثم يحوّل الناتج إلى `AuthUser`، ثم يحدّث الكوكي بـ`persistSessionUser(user)`.
  - `initialData: readSessionUser()` مع `initialDataUpdatedAt: 0`، فيُعاد الجلب فوراً في الخلفية.
  - `staleTime: 5 * 60_000` و`refetchOnWindowFocus: true` **لهذا الاستعلام وحده**.
  - يتوحّد مفتاحا الاستعلام: يُحذف `queryKeys.auth.session`، أو يصبح اسماً آخر لـ`queryKeys.users.me`، حتى لا يوجد مصدران لنفس البيانات. `useMe()` في صفحة الملف الشخصي يبقى كما هو، لأنه يحتاج `reportInfo` ويقرأ المفتاح نفسه.
- **ممنوع:** إضافة Context أو Store ثانٍ للصلاحيات. `AuthContext` الحالي يكفي بعد توسيع `AuthUser`.

### D2 — نموذج الصلاحيات: دالة نقية + hook واحد

- `src/lib/auth/permissions.ts` دالة نقية بلا React:

  ```ts
  export function can(p: Permissions | null | undefined, resource: Resource, action: Action): boolean {
    return p?.[resource]?.includes(action) ?? false;
  }
  ```

- `src/hooks/auth/use-can.ts` يعيد `(resource, action) => boolean` مبنياً على `useAuthContext().user?.permissions`.
- **ممنوع:** أي فحص لـ`role.builtIn === 'ADMIN'` لاتخاذ قرار تفويض. `builtIn` يُستخدم فقط لقواعد العرض الخاصة بالأدوار المدمجة في شاشة الأدوار (D8).

### D3 — حارس المسار: `RequirePermission` يحل محل `RequireRole`

- في `src/components/auth/require-permission.tsx`:
  - الواجهة: `<RequirePermission resource="REPORTS" action="VIEW" />`، ويعيد `<Outlet />` أو `<Navigate to={ROUTES.home} replace />`.
  - يُركَّب دائماً تحت `RequireAuth`، مثل الحارس الحالي.
- يُحذف `require-role.tsx` بعد انتهاء الترحيل (القاعدة 32: لا شيفرة ميتة).
- **تنبيه:** `CLAUDE.md` §11 يذكر `components/auth/role-guard.tsx`، وهو غير موجود. الموجود فعلاً `require-role.tsx`. نتبع الكود الفعلي، ونحدّث السطر في `CLAUDE.md` ضمن المرحلة 8.

### D4 — الصفحة الرئيسية (`/`): أول صفحة مسموحة

`HomeRedirect` يوجّه إلى أول مسار يملك المستخدم صلاحيته، بهذا الترتيب:

1. `dashboard` ← `REPORTS:VIEW`
2. `reports.list` ← `REPORTS:VIEW`
3. `formTypes.list` ← `FORM_TYPES:VIEW`
4. `crimeTypes.list` ← `CRIME_TYPES:VIEW`
5. `admin.users` ← `USERS:VIEW`
6. `admin.roles` ← `ROLES:VIEW`
7. `profile` ← متاحة دائماً

يمنع هذا حلقة إعادة توجيه لا نهائية، إذ لا يعيد `RequirePermission` المستخدم إلى `/` إن كان `/` نفسه غير مسموح.

### D5 — الـ Dashboard: يُفتح بـ`REPORTS:VIEW`، وكل بطاقة تُحرس بصلاحيتها

- المسار يحتاج `REPORTS:VIEW` فقط، لأن الإحصائيات والضبوط تحت هذه الصلاحية (جدول القسم 4).
- بطاقة «المستخدمون» و`useUsers` يعملان فقط إن وُجدت `USERS:VIEW`. بطاقة «نماذج الضبوط» و`useFormTypes` فقط إن وُجدت `FORM_TYPES:VIEW`.
- الآلية: يُضاف خيار `enabled` إلى الـ hooks، فتصبح `useUsers({ enabled })` و`useFormTypes({ enabled })`، ولا تُدخل الاستعلامات المعطّلة في `isPending` و`isError`.
- ⚠️ **يغيّر هذا تجربة دور «مستخدم»:** سيرى الـ Dashboard بعد أن كان يوجَّه إلى قائمة الضبوط. **يحتاج تأكيداً من صاحب المنتج** (القسم 4، Q1).

### D6 — إنشاء المستخدم: مساران حسب صلاحية `ROLES:VIEW`

| المنفّذ يملك | المسار | حقل الدور |
|---|---|---|
| `USERS:CREATE` + `ROLES:VIEW` | `POST /users` مع `roleId` | قائمة منسدلة من `GET /roles` |
| `USERS:CREATE` فقط | `POST /auth/register` | مخفي، مع ملاحظة «سيُنشأ بدور مستخدم» |

زر «مستخدم جديد» يظهر فقط مع `USERS:CREATE`.

### D7 — ترحيل الكوكي القديم دون إخراج المستخدمين

`readSessionUser()` يتحقق من الشكل: إن كان `typeof role === 'string'` أو كانت `permissions` غائبة، يعيد `null` **دون** مسح التوكنات.

النتيجة:

- يعرض `RequireAuth` مؤشر التحميل (`RouteFallback`).
- يجلب `useSession` الملف من `/users/me` بالتوكن الصالح، ثم يعيد كتابة الكوكي بالشكل الجديد.
- **لا يُطلب من أي مستخدم إعادة الدخول.**

### D8 — قواعد عرض الأدوار المدمجة (من 4.1)

| الدور | تعديل | حذف |
|---|---|---|
| `builtIn: 'ADMIN'` | ❌ (للقراءة فقط، والمصفوفة معطّلة كلها) | ❌ |
| `builtIn: 'USER'` | ✅ | ❌ |
| `builtIn: null` | ✅ | ✅، مع معالجة `409` «مسند لمستخدمين» |

### D9 — مزامنة الصلاحيات عند `403`

في `lib/query/query-client.ts` يُضاف `queryCache: new QueryCache({ onError })` و`mutationCache: new MutationCache({ onError })`، وكلاهما يفعل الشيء نفسه: عند `ApiError` بحالة `403` يستدعي `invalidateQueries({ queryKey: queryKeys.users.me })`.

- **السبب:** إن سُحبت صلاحية أثناء الجلسة، يتسبب أول `403` في إخفاء الأزرار والروابط تلقائياً.
- **ممنوع:** إخراج المستخدم عند `403`. هذا السلوك الحالي في `client.ts` صحيح ويجب الحفاظ عليه.

### D10 — مكوّن `Checkbox` دون تبعية جديدة

`src/components/ui/checkbox.tsx` مبني على `<input type="checkbox">` أصلي بتنسيق Tailwind و`forwardRef`، ويدعم `indeterminate` لخانة «تحديد كل الصف». **لا يُضاف `@radix-ui/react-checkbox`** (القاعدة 21).

### D11 — المعرّفات أرقام

`AuthUser.id` و`UserResponse.id` و`creatorId` وتواقيع `lib/users/api.ts` و`queryKeys.users.detail` تتحول من `string` إلى `number`، مطابقةً للدليل (القسم 8). الخطر منخفض، لأن الـ JSON يحمل أرقاماً أصلاً والأنواع هي الخاطئة، لكن هذا التصحيح لازم لمقارنة «هل هذا صفّي أنا؟» في جدول المستخدمين.

---

## 4. غموض وتناقضات في الدليل — تحقق قبل البناء

| # | المسألة | التناقض | الإجراء |
|---|---|---|---|
| A1 | شكل `creator.role` داخل `ReportResponse` | مثال 7.5 يُظهر `"role": "USER"` نصاً، بينما القسم 5 يقول إن `role` في `UserResponse` صار كائناً | **المرحلة 0:** `curl` على `GET /reports/{id}` وتوثيق الشكل الفعلي. الواجهة لا تعرض `creator.role` حالياً، فالأثر على الأنواع فقط. نعرّفه `RoleSummary \| null` إن تأكد أنه كائن |
| A2 | مثال Axios في القسم 9 يخزّن التوكن في `localStorage` | يخالف معمارية المشروع (كوكيز عبر `lib/session`) | **نتجاهل المثال.** نبقي `lib/session` و`lib/api/client.ts`. `CLAUDE.md` §5 يمنع عميل HTTP ثانياً |
| A3 | اسم المتغير `VITE_API_URL` في الدليل | المشروع يستخدم `VITE_API_BASE_URL` (مع `/api/v1`) ويتحقق منه بـZod | نبقي الاسم الحالي |
| A4 | هل تُكشف رسائل `403` و`409` بالعربية؟ | الدليل يقول «رسالة توضّح السبب» دون ذكر اللغة | **المرحلة 0:** اختبار حالتين. إن كانت الرسائل إنجليزية نعرض نصاً عربياً ثابتاً حسب السياق |
| A5 | هل يعيد `GET /roles/options` تسميات عربية؟ | الدليل يقول نعم | نعتمد عليها ولا نثبّت التسميات في الواجهة |

**أسئلة لصاحب المنتج** (للكل افتراض آمن، والتنفيذ لا يتوقف عليها):

- **Q1:** هل يرى دور «مستخدم» الـ Dashboard؟ *الافتراض: نعم، حسب D5.*
- **Q2:** إعادة تفعيل صفحة المستخدمين (`FEATURES.usersPage`) التي أُطفئت سابقاً؟ *الافتراض: نعم، لأن الـ Backend صار يدعم الإدارة كاملة. يُحذف الـ flag والتعليق.*
- **Q3:** هل يُمنع المستخدم من تعطيل نفسه أو حذفها أو تغيير دوره من الواجهة؟ *الافتراض: نعم، تُخفى هذه الإجراءات في صفّه، لأن الـ Backend يسمح بها لغير آخر مدير، والنتيجة فقدان وصول فوري.*

---

## 5. خطة التنفيذ على مراحل

> كل مرحلة تنتهي بـ: `npm run typecheck && npm run lint && npm run build` ناجحة + commit مستقل.
> لا تبدأ مرحلة قبل نجاح تحقق سابقتها. الترتيب يتبع `CLAUDE.md` §27.

### المرحلة 0 — التحقق من العقد الحي (بلا تعديل كود)

**الهدف:** حسم الغموض A1 وA4 بالبيانات الفعلية.

```bash
BASE=http://localhost:8080/api/v1
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@gmail.com","password":"12345678"}' | jq -r .token)
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@gmail.com","password":"12345678"}' | jq '{role, permissions}'
curl -s $BASE/users/me      -H "Authorization: Bearer $TOKEN" | jq
curl -s $BASE/users         -H "Authorization: Bearer $TOKEN" | jq '.[0]'
curl -s $BASE/roles         -H "Authorization: Bearer $TOKEN" | jq
curl -s $BASE/roles/options -H "Authorization: Bearer $TOKEN" | jq
curl -s "$BASE/reports?size=1" -H "Authorization: Bearer $TOKEN" | jq '.content[0].creator'
# A4: رسالة 409 (حذف دور مدمج)
curl -s -X DELETE $BASE/roles/1 -H "Authorization: Bearer $TOKEN" | jq .message
```

**المخرج:** ملاحظة قصيرة في وصف الـ PR بالأشكال الفعلية. إن خالف أيٌّ منها الدليل، **توقّف واسأل**.

---

### المرحلة 1 — الأنواع ونواة الصلاحيات

**الملفات:**

| الملف | التغيير |
|---|---|
| `src/types/role.ts` (جديد) | `Resource`، `Action`، `Permissions`، `BuiltInRole`، `RoleSummary`، `RoleResponse`، `RoleRequest`، `RoleOptionsResponse` مطابقة للقسم 8 حرفياً. `EnumOption` يُستورد من `types/report.ts` ولا يُكرَّر |
| `src/types/auth.ts` | حذف `UserRole`. `AuthUser = { id: number; fullName; email; role: RoleSummary \| null; permissions: Permissions }`. تحديث التعليق (لم يعد «لا يوجد /auth/me») |
| `src/types/user.ts` | `id: number`، `role: RoleSummary \| null`، `permissions?: Permissions`. إضافة `CreateUserRequest`، `UserRoleRequest`، `UserEnabledRequest` |
| `src/types/report.ts` | `creatorId?: number` |
| `src/lib/auth/permissions.ts` (جديد) | `can()` (D2) + `roleLabel(role: RoleSummary \| null): string`، التي تعيد `role?.name ?? 'بدون دور'` |
| `src/lib/auth/api.ts` | `LoginResponse` يمتد من `AuthUser` بالشكل الجديد |
| `src/lib/session/session.ts` | `readSessionUser()` يتحقق من الشكل (D7)، وإضافة `persistSessionUser(user)` لتحديث الكوكي وحده. تحديث التعليقات القديمة |
| `src/lib/users/api.ts` + `query-keys.ts` | المعرّفات `number` (D11) |

**معيار القبول:** `typecheck` يفشل **فقط** في مواقع الاستهلاك المعروفة (جدول «المكوّنات» في القسم 6)، ولا يفشل في أي مكان غير متوقع. هذه قائمة عمل المرحلتين 3 و4. لإبقاء كل commit أخضر، يمكن دمج المراحل 1–4 في PR واحد بـ4 commits.

---

### المرحلة 2 — مصدر الهوية: `/users/me` + الدخول + الترحيل

| الملف | التغيير |
|---|---|
| `src/hooks/auth/use-session.ts` | حسب D1: `queryFn` حقيقية + `initialData` من الكوكي + `staleTime` 5 دقائق + `refetchOnWindowFocus` |
| `src/hooks/auth/use-login.ts` | بناء `AuthUser` بـ`role` و`permissions`. في `getLoginErrorMessage`: عند `401` مع رسالة `User is disabled` تُعرض «تم تعطيل هذا الحساب. يرجى مراجعة مدير النظام.»، وأي `401` آخر يعرض رسالة «بيانات غير صحيحة» الحالية |
| `src/lib/api/client.ts` | في `forceLogoutRedirect(reason?)`: إن كان سبب الفشل `User is disabled` تُعرض «تم تعطيل حسابك.» بدل «انتهت جلستك». **لا تغيير آخر في الملف** |
| `src/lib/query/query-client.ts` | `QueryCache` و`MutationCache` مع `onError` لحالة `403` (D9) |
| `src/lib/query/query-keys.ts` | توحيد `auth.session` مع `users.me` (D1) |

**معيار القبول:**

- الدخول بالمدير يخزّن الكوكي بالشكل الجديد.
- إعادة تحميل الصفحة بكوكي قديم الشكل (يُصنع يدوياً من DevTools) لا تُخرج المستخدم، ويُعاد بناء الكوكي.
- تعطيل حساب من جلسة مدير أخرى ثم تنفيذ أي طلب يُخرج المستخدم برسالة «تم تعطيل حسابك».

---

### المرحلة 3 — الحرّاس والمسارات والتنقل

| الملف | التغيير |
|---|---|
| `src/hooks/auth/use-can.ts` (جديد) | D2 |
| `src/components/auth/require-permission.tsx` (جديد) | D3 |
| `src/components/auth/require-role.tsx` | **حذف** بعد استبدال كل الاستخدامات |
| `src/components/auth/home-redirect.tsx` | D4 |
| `src/constant/routes.ts` | `admin.roles: '/admin/roles'` |
| `src/routes/route-config.tsx` | كل مسار داخل `RequirePermission` حسب جدول القسم 6. المسارات التي لا تحتاج صلاحية: `home` و`profile` |
| `src/routes/lazy-pages.ts` | تسجيل `RolesListPage` (بعد إنشائها في المرحلة 5، ومؤقتاً يُترك بلا مسار) |
| `src/components/layout/sidebar-nav.tsx` | كل رابط يحمل `permission?: { resource; action }` |
| `src/components/layout/sidebar.tsx` + `layouts/authenticated-layout.tsx` | تصفية الروابط بـ`useCan`. تُخفى المجموعة إن فرغت. يُحذف تمرير `adminGroup` المشروط بالدور |
| `src/constant/features.ts` | حذف `usersPage` (Q2) |

**معيار القبول:**

- حساب بدور «قارئ» (`REPORTS:VIEW` فقط) يرى: نظرة عامة، كل الضبوط، الملف الشخصي. لا يرى غيرها.
- فتح `/admin/roles` يدوياً بهذا الحساب يعيده إلى `/`، ولا تحدث حلقة إعادة توجيه.

---

### المرحلة 4 — استبدال فحوص الدور داخل المكوّنات

كل موضع من جدول القسم 6 (عمود «المكوّنات»):

- `role === 'ADMIN'` يُستبدل بـ`can(...)` المناسبة.
- `ROLE_LABELS[...]` يُستبدل بـ`roleLabel(user.role)`.

إضافة إلى ذلك (G15):

- `src/hooks/users/use-users.ts`، `src/hooks/form-types/use-form-types.ts`، `src/hooks/crime-types/use-crime-types.ts`: قبول `options?: { enabled?: boolean }`.
- `report-filters.tsx`: فلتر «المنشئ» يظهر فقط مع `USERS:VIEW`، وفلتر نوع النموذج مع `FORM_TYPES:VIEW`، وفلتر نوع الجرم مع `CRIME_TYPES:VIEW`.
- `report-form.tsx` ومحدد النموذج المتسلسل: زر «ضبط جديد» يحتاج `REPORTS:CREATE` **و** `FORM_TYPES:VIEW` (القسم 4.4). إن غابت `CRIME_TYPES:VIEW` يُعطَّل حقل نوع الجرم مع تلميح «لا تملك صلاحية استعراض أنواع الجرم»، لأنه حقل اختياري.
- `dashboard-page.tsx`: حسب D5.

**معيار القبول:**

- `grep -rn "'ADMIN'\|ROLE_LABELS\|UserRole\|allowedRoles" src` لا يعيد أي نتيجة، باستثناء `BuiltInRole` في `types/role.ts`.
- لا يصدر أي طلب يعود بـ`403` عند تصفح التطبيق بحساب «قارئ» (يُتحقق من تبويب Network).

---

### المرحلة 5 — ميزة إدارة الأدوار (جديدة)

الترتيب حسب `CLAUDE.md` §27:

1. **`src/lib/roles/api.ts`:** `list`، `options`، `get(id)`، `create(body)`، `update(id, body)`، `remove(id)`.
2. **`src/lib/query/query-keys.ts`:** `roles: { all, list(), detail(id), options() }`.
3. **`src/hooks/roles/use-roles.ts`:** `useRoles({ enabled })` و`useRoleOptions()`. خيارات الأدوار شبه ثابتة، فيُضبط لها `staleTime: Infinity`.
4. **`src/hooks/roles/use-role-mutations.ts`:** `useCreateRole`، `useUpdateRole`، `useDeleteRole`.
   - بعد النجاح: `invalidate(roles.all)` + `invalidate(users.all)` + `invalidate(users.me)`، لأن تعديل دور المستخدم الحالي يغيّر صلاحياته فوراً.
   - أخطاء بالعربية:

     | الحالة | الرسالة |
     |---|---|
     | `409` عند الإنشاء أو التعديل | «اسم الدور مستخدم بالفعل» |
     | `409` عند الحذف | «لا يمكن حذف دور مدمج أو دور مسند لمستخدمين» |
     | `409` عند تعديل مدير النظام | «دور مدير النظام لا يُعدَّل» |
     | `403` | «لا يمكنك منح صلاحيات لا تملكها» |

     تُعرض `fieldErrors` تحت الحقول.
5. **`src/components/ui/checkbox.tsx`:** D10.
6. **`src/components/roles/permission-matrix.tsx`:**
   - الصفوف `options.resources`، والأعمدة `options.actions`، والتسميات من الـ Backend.
   - تحديد `CREATE` أو `UPDATE` أو `DELETE` يحدّد `VIEW` تلقائياً، وإلغاء `VIEW` يلغي بقية الصف (القسم 4.4: «UPDATE وDELETE عملياً تحتاجان VIEW»).
   - خانة «كل الصف» بحالة `indeterminate`.
   - **الخانات التي لا يملكها المنفّذ نفسه معطّلة** مع `title="لا تملك هذه الصلاحية"` (4.3). هذا لتجربة المستخدم فقط، والـ Backend هو الحَكَم.
   - جدول حقيقي بـ`<table>`: `<th scope>` لكل صف وعمود، و`aria-label` لكل خانة بصيغة «الضبوط — تعديل». على الشاشات الصغيرة يمرَّر أفقياً.
7. **`src/components/roles/role-form-dialog.tsx`:** `react-hook-form` + `zod`: `name` مطلوب وطوله 100 حرف كحد أقصى. في الإرسال يُرسل **كامل** المصفوفة، لأن `PUT` يستبدل كل الصلاحيات (4.5).
8. **`src/components/roles/roles-table.tsx`:** الاسم، شارة «مدمج» عند `builtIn`، عدد الصلاحيات، الإجراءات حسب D8 وصلاحيات `ROLES:UPDATE` و`ROLES:DELETE`.
9. **`src/components/roles/delete-role-dialog.tsx`:** مبني على `confirm-dialog` الموجود.
10. **`src/pages/roles/roles-list-page.tsx`:** حالات التحميل والفراغ والخطأ بنفس نمط `users-list-page.tsx`. زر «دور جديد» يظهر مع `ROLES:CREATE`.
11. **المسار ورابط الشريط الجانبي:** «الأدوار والصلاحيات» تحت «إدارة النظام» مع `ROLES:VIEW`.

**معيار القبول:**

- إنشاء دور «قارئ» ثم تعديله ثم حذفه يعمل.
- لا يمكن تعديل «مدير النظام» ولا حذفه من الواجهة.
- حذف دور مسند لمستخدمين يعرض رسالة `409` العربية.
- مدير بلا `ROLES:DELETE` لا يرى زر الحذف.

---

### المرحلة 6 — ترقية إدارة المستخدمين

| الملف | التغيير |
|---|---|
| `src/lib/users/api.ts` | `create(body: CreateUserRequest)` يرسل `POST /users`. `setRole(id, roleId)` و`setEnabled(id, enabled)` جديدتان. يُحذف الاسم المستعار `create = register` وتعليقه القديم. يُبقى `register` في `lib/auth` لمسار D6 الثاني |
| `src/hooks/users/use-create-user.ts` | يختار المسار حسب D6 |
| `src/hooks/users/use-set-user-role.ts` (جديد) | + invalidate `users.all` |
| `src/hooks/users/use-set-user-enabled.ts` (جديد) | تحديث متفائل (optimistic) للمفتاح في قائمة المستخدمين، مع تراجع عند الخطأ |
| رسائل الأخطاء (مشتركة) | `src/lib/users/errors.ts` بنفس نمط `lib/reports/errors.ts`. `409` عند التعطيل أو تغيير الدور أو الحذف لآخر مدير: «لا يمكن: هذا آخر مدير نظام مفعّل». `409` عند الحذف لمستخدم له ضبوط: «لا يمكن الحذف: للمستخدم ضبوط مرتبطة». `403`: «لا يمكنك التصرف بمستخدم يملك صلاحيات أعلى منك» |
| `src/components/admin/users/create-user-dialog.tsx` | حقل الدور (`select` الموجود) مع `ROLES:VIEW`. يُحدَّث نص الوصف |
| `src/components/admin/users/change-role-dialog.tsx` (جديد) | قائمة الأدوار، والدور الحالي محدد مسبقاً |
| `src/components/admin/users/users-table.tsx` | عمود الدور بـ`roleLabel`. عمود الحالة `Switch` مع `USERS:UPDATE`، ونصه «مفعّل» أو «معطّل». قائمة الإجراءات: تغيير الدور (`USERS:UPDATE` + `ROLES:VIEW`)، بيانات الضبط (`USERS:UPDATE`)، حذف (`USERS:DELETE`). **لا إجراءات على صف المستخدم الحالي** (Q3). يُحذف الشرط `user.role !== 'ADMIN'` |
| `src/pages/admin/users/users-list-page.tsx` | زر «مستخدم جديد» مع `USERS:CREATE` |

**معيار القبول:**

- إنشاء مستخدم بدور مخصص يعمل.
- تغيير دوره يسري فوراً: بعد تركيز نافذته أو أول `403` تتحدّث قائمته الجانبية.
- تعطيله يُخرجه من جلسته في الطلب التالي، وإعادة تفعيله تعيد عمل توكنه.
- محاولة تعطيل آخر مدير تعرض رسالة `409` العربية.

---

### المرحلة 7 — التلميع وحالات الحافة

- `profile-page.tsx` و`header.tsx`: اسم الدور من `role.name`، مع «بدون دور» عند `null`.
- حالة الدور `null` (الدليل يسمح بها في `UserResponse.role`): لا ينهار أي مكوّن، ولا تظهر `undefined` في الواجهة.
- حساب بلا أي صلاحية: يصل إلى الملف الشخصي فقط، مع `EmptyState` لطيف في الـ Dashboard إن فُتح يدوياً؛ لا شاشة بيضاء.
- مراجعة أن كل نص جديد عربي وأن الاتجاه RTL (`CLAUDE.md` §15A).

---

### المرحلة 8 — التحقق الشامل والتوثيق

- `npm run typecheck && npm run lint && npm run build`.
- مصفوفة الاختبار اليدوي (القسم 7) كاملةً على `npm run dev` مقابل Backend حقيقي.
- تحديث `ARCHITECTURE.md` بفقرة قصيرة: مصدر الصلاحيات، `can` و`useCan` و`RequirePermission`، خريطة المسارات.
- تصحيح مرجع `role-guard.tsx` في `CLAUDE.md` §11 إلى `require-permission.tsx`.

---

## 6. خريطة الصلاحيات (مرجع التنفيذ)

### المسارات والتنقل

| المسار / الرابط | الصلاحية |
|---|---|
| `/` (توجيه) | — (D4) |
| `/profile` | — |
| `/admin/dashboard` · «نظرة عامة» | `REPORTS:VIEW` |
| `/reports`، `/reports/:id` | `REPORTS:VIEW` |
| `/reports/:id/edit` | `REPORTS:UPDATE` |
| `/form-types` · «نماذج الضبوط» | `FORM_TYPES:VIEW` |
| `/crime-types` · «أنواع الجرم» | `CRIME_TYPES:VIEW` |
| `/admin/users` · «المستخدمون» | `USERS:VIEW` |
| `/admin/roles` · «الأدوار والصلاحيات» | `ROLES:VIEW` |

### المكوّنات (المواضع الحالية التي تُستبدل)

| الموضع | اليوم | بعد |
|---|---|---|
| `reports-table.tsx:43` حذف | `role === 'ADMIN'` | `REPORTS:DELETE` (+ غير مختوم) |
| `reports-table.tsx` تعديل وتغيير النتيجة | بلا فحص | `REPORTS:UPDATE` (+ غير مختوم) |
| `reports-list-page.tsx` زر ضبط جديد | بلا فحص | `REPORTS:CREATE` + `FORM_TYPES:VIEW` |
| `report-detail-dialog.tsx:222` | `role === 'ADMIN'` | `REPORTS:DELETE` / `REPORTS:UPDATE` |
| `report-result-control.tsx` | بلا فحص | `REPORTS:UPDATE` (وإلا تُعرض النتيجة كشارة للقراءة فقط) |
| `form-types-list-page.tsx:21` | `role === 'ADMIN'` | `FORM_TYPES:CREATE` / `FORM_TYPES:UPDATE` / `FORM_TYPES:DELETE` كلٌّ لزره |
| `form-type-template-form.tsx:76` | `role === 'ADMIN'` | `FORM_TYPES:UPDATE` (القالب تعديل على النوع، القسم 4) |
| `crime-types-list-page.tsx:26` | `role === 'ADMIN'` | `CRIME_TYPES:CREATE` / `CRIME_TYPES:UPDATE` / `CRIME_TYPES:DELETE` |
| `authenticated-layout.tsx:34` | `role === 'ADMIN'` | تصفية الروابط بـ`useCan` |
| `home-redirect.tsx:14` | `role === 'ADMIN'` | D4 |
| `users-table.tsx:24,68,92` | `ROLE_LABELS` + `!== 'ADMIN'` | `roleLabel` + صلاحيات `USERS:*` + ليس صفّي |
| `header.tsx:16,94,104` | `ROLE_LABELS` | `roleLabel` |
| `profile-page.tsx:18,90` | `ROLE_LABELS` | `roleLabel` |
| `route-config.tsx:53,81` | `RequireRole` | `RequirePermission` |
| `dashboard-page.tsx` | `useUsers` و`useFormTypes` دون شرط | `enabled` حسب D5 |
| `report-filters.tsx:83-86` | ثلاث قوائم دون شرط | `enabled` لكلٍّ بصلاحيتها |

---

## 7. مصفوفة الاختبار اليدوي

جهّز ثلاثة حسابات عبر الـ API (القسم 10 من الدليل):

- **مدير:** `admin@gmail.com`.
- **مستخدم:** دور `USER` الافتراضي.
- **قارئ:** دور مخصص بصلاحيات `REPORTS:["VIEW"]` فقط.

| # | السيناريو | مدير | مستخدم | قارئ |
|---|---|---|---|---|
| T1 | روابط الشريط الجانبي | الكل | نظرة عامة، الضبوط، النماذج، الجرم، المستخدمون (قراءة)، الملف | نظرة عامة، الضبوط، الملف |
| T2 | الدخول المباشر إلى `/admin/roles` | ✅ | ↩︎ `/` | ↩︎ `/` |
| T3 | زر «ضبط جديد» | ✅ | ✅ | ❌ |
| T4 | حذف ضبط | ✅ | ❌ | ❌ |
| T5 | تبويب Network: لا طلبات `403` أثناء التصفح | ✅ | ✅ | ✅ |
| T6 | الـ Dashboard يُحمّل دون خطأ | ✅ | ✅ (ببطاقة مستخدمين) | ✅ (بلا بطاقة مستخدمين ولا نماذج) |
| T7 | المدير يسحب `REPORTS:CREATE` من «مستخدم» والمستخدم في جلسته | — | يختفي الزر بعد تركيز النافذة أو أول `403` | — |
| T8 | المدير يعطّل «قارئ» | — | — | الطلب التالي يُخرجه برسالة «تم تعطيل حسابك» |
| T9 | الدخول بحساب معطّل | — | — | رسالة «تم تعطيل هذا الحساب» |
| T10 | كوكي بالشكل القديم ثم إعادة تحميل | لا خروج، ويُعاد بناء الكوكي | = | = |
| T11 | تعديل «مدير النظام» أو حذفه أو حذف «مستخدم» | الأزرار مخفية أو معطّلة | — | — |
| T12 | تعطيل آخر مدير (عبر API لتجاوز إخفاء الواجهة) | رسالة `409` عربية | — | — |
| T13 | إجراءات على صفّي في جدول المستخدمين | مخفية | مخفية | — |
| T14 | الضبط المختوم: لا تعديل ولا حذف ولا تغيير نتيجة | ✅ | ✅ | ✅ |
| T15 | عرض 375px: مصفوفة الصلاحيات تمرّر أفقياً دون كسر الصفحة | ✅ | — | — |

---

## 8. المخاطر والتخفيف

| الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|
| نشر الـ Backend قبل الواجهة يعطّل التفويض للجميع | عالٍ إن لم يُنسَّق | عالٍ | دمج المراحل 1–4 ونشرها **مع** الـ Backend، أو قبله إن تحقق A1 وكانت الأنواع متسامحة |
| حلقة إعادة توجيه بين `/` والحراس | متوسط | عالٍ | D4 + T2 + الالتزام بالقيمة المُذكَّرة (`useMemo`) في `AuthProvider` كما هي |
| كوكي قديم يُسقط الجلسات | متوسط | متوسط | D7 + T10 |
| حجم الكوكي مع `permissions` | منخفض (~300 بايت) | منخفض | لا تُخزَّن `reportInfo` في الكوكي |
| كثرة طلبات `/users/me` | منخفض | منخفض | `staleTime` 5 دقائق + إزالة التكرار في react-query |
| `403` صامتة من قوائم مساعدة | عالٍ دون G15 | متوسط | خيار `enabled` + T5 |
| تباين رسائل الـ Backend (إنجليزي أو عربي) | متوسط | منخفض | نص عربي ثابت حسب السياق، ورسالة الـ Backend للسجل فقط |

---

## 9. خارج النطاق

- أي تغيير في تقارير PDF وExcel والإحصائيات والقوالب، لأنها منفّذة ومطابقة.
- استبدال `fetch` بـAxios كما في مثال الدليل (A2).
- صفحة تسجيل عامة: الدليل يغلقها صراحةً.
- إضافة Vitest أو Playwright (`CLAUDE.md` §20)، إلا بطلب صريح.
- إعادة تصميم الشريط الجانبي أو الـ Dashboard بصرياً.

---

## 10. تعريف الإنجاز

- [ ] لا توجد أي إشارة لـ`UserRole` أو `'ADMIN'` كفحص تفويض أو `ROLE_LABELS` في `src/`.
- [ ] كل مسار محمي بـ`RequirePermission` حسب القسم 6، و`require-role.tsx` محذوف.
- [ ] الصلاحيات تُجلب من `/users/me` وتتزامن عند التركيز وعند `403`.
- [ ] إدارة الأدوار تعمل كاملة مع قواعد D8 ومنع التصعيد في الواجهة.
- [ ] إدارة المستخدمين: إنشاء بدور، تغيير دور، تعطيل وتفعيل، حذف، مع رسائل `403` و`409` عربية.
- [ ] رسالة «الحساب معطّل» عند الدخول وعند الإخراج أثناء الجلسة.
- [ ] `npm run typecheck`، `npm run lint` (صفر تحذيرات)، `npm run build` كلها ناجحة.
- [ ] مصفوفة الاختبار T1–T15 ناجحة ومسجّلة في وصف الـ PR.
- [ ] `ARCHITECTURE.md` و`CLAUDE.md` §11 محدّثان.
