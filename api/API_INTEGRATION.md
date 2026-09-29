# Medad API — دليل التكامل لمطوّر React

هذا الملف يصف كل ما يحتاجه تطبيق React للتعامل مع الـ Backend: المصادقة، شكل الأخطاء، كل الـ endpoints مع أمثلة الطلب والاستجابة، ونماذج TypeScript جاهزة.

---

## 1. معلومات عامة

| البند | القيمة |
|---|---|
| Base URL (تطوير) | `http://localhost:8080` |
| بادئة كل المسارات | `/api/v1` |
| صيغة البيانات | JSON بترميز UTF-8 |
| توثيق تفاعلي (Swagger) | `http://localhost:8080/swagger-ui.html` |
| المصادقة | JWT Bearer في ترويسة `Authorization` |

**ترويسات يجب إرسالها مع كل طلب يحمل جسماً:**

```http
Content-Type: application/json; charset=utf-8
Authorization: Bearer <token>
```

> ✅ **CORS** مفعّل للـ origins التالية افتراضياً: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`. إن كانت الواجهة تعمل على عنوان آخر، أضفه إلى الخاصية `app.cors.allowed-origins` في `application.properties` (قائمة مفصولة بفواصل، وتقبل أنماطاً مثل `http://localhost:[*]`). الطلبات تُرسل بدون cookies، لذا لا تستخدم `withCredentials` في Axios.

---

## 2. المصادقة (Authentication)

### 2.1 التسجيل

`POST /api/v1/auth/register` — **مغلق أمام العموم**: يحتاج توكن مستخدم يملك `USERS:CREATE` (افتراضياً مدير النظام وحده)؛ بدون توكن `403`، وبتوكن لا يملكها `403`. الحساب الجديد يأخذ دائماً الدور المدمج «مستخدم» (`builtIn: "USER"`)، ويُرفض بـ`403` إن كان هذا الدور يمنح صلاحية لا يملكها المنفّذ (القسم 4.4). لإنشاء حساب بدور آخر استخدم `POST /api/v1/users` (القسم 5)، وهو الأنسب لشاشة إدارة المستخدمين.

```json
{
  "fullName": "أحمد علي",
  "email": "ahmed@example.com",
  "password": "12345678",
  "reportInfo": {
    "governorate": "بغداد",
    "district": "الكرخ",
    "subDistrict": "المنصور",
    "department": "قسم 1",
    "policeStation": "مخفر المنصور"
  }
}
```

- `fullName` و`email` (بصيغة بريد صحيحة) و`password` مطلوبة، وإلا يعود `400`.
- `reportInfo` **اختياري**. إن أُرسل فيجب أن تكون حقوله الخمسة كلها غير فارغة، وإلا يعود `400`.
- الاستجابة `201` بجسم من نوع `UserResponse` (انظر القسم 7).

### 2.2 تسجيل الدخول

`POST /api/v1/auth/login` — بدون توكن.

```json
{ "email": "admin@gmail.com", "password": "12345678" }
```

الاستجابة `200`:

```json
{
  "id": 1,
  "fullName": "Admin",
  "email": "admin@gmail.com",
  "role": { "id": 1, "name": "مدير النظام", "builtIn": "ADMIN" },
  "permissions": {
    "REPORTS": ["VIEW", "CREATE", "UPDATE", "DELETE"],
    "FORM_TYPES": ["VIEW", "CREATE", "UPDATE", "DELETE"],
    "CRIME_TYPES": ["VIEW", "CREATE", "UPDATE", "DELETE"],
    "USERS": ["VIEW", "CREATE", "UPDATE", "DELETE"],
    "ROLES": ["VIEW", "CREATE", "UPDATE", "DELETE"]
  },
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

- `role` كائن `{ id, name, builtIn }` (كان نصاً `"ADMIN"`/`"USER"`)، و`permissions` ما يستطيعه المستخدم (القسم 4).
- بيانات خاطئة تُرجع `401` بجسم خطأ رسالته `Bad credentials`.

### 2.3 تجديد التوكن

`POST /api/v1/auth/refresh` — بدون توكن.

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

الاستجابة `200`:

```json
{ "token": "<access token جديد>", "refreshToken": "<نفس refresh token المُرسل>" }
```

ويعود `401` إن كان الـ refresh token غير صالح أو منتهياً (`Invalid or expired token`)، أو صاحبه محذوفاً (`Invalid refresh token`) أو معطّلاً (`User is disabled`). في كل هذه الحالات أخرج المستخدم إلى صفحة الدخول.

### 2.4 مدد الصلاحية والسلوك المتوقع

| العنصر | المدة |
|---|---|
| Access token | 24 ساعة |
| Refresh token | 30 يوماً |

| الحالة | الكود | الجسم |
|---|---|---|
| لا توجد ترويسة `Authorization` | `403` | **فارغ** |
| توكن غير صالح أو منتهٍ | `401` | JSON برسالة `Invalid or expired token` |
| توكن صالح لكن الحساب **معطّل** (`enabled: false`) | `401` | JSON برسالة `User is disabled` |
| توكن صالح لكن الدور لا يمنح الصلاحية المطلوبة | `403` | JSON برسالة `Access denied` |

حالة الحساب تُفحص مع **كل طلب**: تعطيل مستخدم (`PUT /users/{id}/enabled`، القسم 5) يوقف توكناته الحالية فوراً، ويمنعه من التجديد ومن الدخول. إعادة تفعيله تعيد عمل توكناته التي لم تنتهِ بعد.

**الاستراتيجية الموصى بها في React**: عند `401` على أي طلب محمي، استدعِ `/auth/refresh` مرة واحدة، خزّن التوكن الجديد، وأعد الطلب الأصلي. إن فشل التجديد أيضاً، أخرج المستخدم إلى صفحة الدخول. (مثال interceptor في القسم 8.)

### 2.5 الحساب الافتراضي للتطوير

| البريد | كلمة المرور | الدور |
|---|---|---|
| `admin@gmail.com` | `12345678` | مدير النظام (`ADMIN`) |

---

## 3. شكل الأخطاء الموحّد

كل الأخطاء (عدا حالة غياب التوكن) تعود بهذا الشكل:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/reports",
  "timestamp": "2026-09-06T13:14:14.91",
  "fieldErrors": {
    "reportNumber": "must not be blank",
    "formTypeId": "must not be null"
  }
}
```

- `fieldErrors` يظهر **فقط** في أخطاء التحقق `400`، ومفاتيحه أسماء الحقول. للحقول المتداخلة يكون المفتاح بصيغة `reportInfo.district`.

| الكود | متى يظهر |
|---|---|
| `400` | فشل التحقق، JSON غير صالح، قيمة parameter غير صالحة (مثل تاريخ خاطئ)، محاولة جعل نوع أباً لنفسه أو لأحد أسلافه |
| `401` | توكن غير صالح/منتهٍ، بيانات دخول خاطئة، أو حساب معطّل (`User is disabled`) |
| `403` | غياب التوكن (جسم فارغ)، أو دور لا يمنح الصلاحية (`Access denied`)، أو محاولة منح صلاحيات أو التصرف بمستخدم يملك صلاحيات لا يملكها المنفّذ (رسالة توضّح السبب، القسم 4.4) |
| `404` | سجل غير موجود (تقرير، نوع نموذج، نوع جرم، مستخدم، دور، أو `formTypeId`/`crimeTypeId`/`parentId`/`roleId` غير موجود في الطلب) |
| `409` | تكرار قيمة فريدة (`reportNumber`، `name` لنوع النموذج أو نوع الجرم أو الدور، `email`)، حذف سجل مرتبط بسجلات أخرى، **تعديل/حذف ضبط نتيجته `CLOSED`** (تم ختم الضبط)، تعديل دور مدير النظام أو حذف دور مدمج أو دور مسند لمستخدمين، أو إزالة آخر مدير نظام مفعّل أو تعطيله |
| `500` | خطأ غير متوقع |

---

## 4. الأدوار والصلاحيات (RBAC)

لكل مستخدم **دور واحد**، والدور مجموعة صلاحيات. الصلاحية = **عملية** على **مورد**، ويكتبها الـ Backend بالشكل `RESOURCE:ACTION` (مثل `REPORTS:CREATE`):

- العمليات أربع: `VIEW` استعراض، `CREATE` إضافة، `UPDATE` تعديل، `DELETE` حذف.
- الموارد خمسة: `REPORTS` الضبوط، `FORM_TYPES` أنواع نماذج الضبوط، `CRIME_TYPES` أنواع الجرم، `USERS` المستخدمون، `ROLES` الأدوار والصلاحيات.

> الصلاحية تشمل **كل السجلات** لا سجلات صاحبها وحده: من يملك `REPORTS:UPDATE` يعدّل أي ضبط، لا ضبوطه فقط.

### 4.1 دليل الصلاحيات: ماذا يستطيع صاحب كل صلاحية

- **ما يستطيعه**: النص نفسه الذي يرجعه `GET /roles/options` في `description`، لتعرضه للمدير بجانب كل خانة في محرر الأدوار.
- **في الواجهة**: ما تُظهره لمن يملك الصلاحية، وتخفيه عمّن لا يملكها.
- **يحتاج معها**: صلاحيات لا تعمل شاشات هذه الصلاحية بدونها (`requires` في `/roles/options`). القاعدة: أي إضافة أو تعديل أو حذف يحتاج استعراض المورد نفسه، ويُضاف إليه ما تجلبه نماذج الإدخال من قوائم. الـ Backend لا يفرضها، فامنحها معاً (القسم 4.5).

#### الضبوط — `REPORTS`

| الصلاحية | ما يستطيعه | في الواجهة | يحتاج معها | الـ endpoints |
|---|---|---|---|---|
| `REPORTS:VIEW` | عرض قائمة الضبوط والبحث فيها وفتح أي ضبط، وطباعة ورقة الضبط، وعرض الإحصائيات، وتصدير سجل الضبوط إلى Excel | رابط «الضبوط» وصفحة الضبط، زر الطباعة، صفحة الإحصائيات، زر تصدير Excel | — | `GET /reports`، `/reports/{id}`، `/reports/{id}/pdf`، `/reports/statistics`، `/reports/export` |
| `REPORTS:CREATE` | تنظيم ضبط جديد، ويُسجَّل المستخدم منظِّماً له | زر «ضبط جديد» ونموذج الإضافة | `REPORTS:VIEW`، `FORM_TYPES:VIEW`، `CRIME_TYPES:VIEW` | `POST /reports` |
| `REPORTS:UPDATE` | تعديل أي ضبط وتغيير نتيجته، ومن ذلك ختمه؛ والضبط المختوم لا يُعدَّل بعد ذلك | زرّا «تعديل» و«تغيير النتيجة»؛ أخفِهما إن كانت النتيجة `CLOSED` | `REPORTS:VIEW`، `FORM_TYPES:VIEW`، `CRIME_TYPES:VIEW` | `PUT /reports/{id}`، `PATCH /reports/{id}/result` |
| `REPORTS:DELETE` | حذف أي ضبط لم يُختم | زر «حذف»؛ أخفِه إن كانت النتيجة `CLOSED` | `REPORTS:VIEW` | `DELETE /reports/{id}` |

فلاتر قائمة الضبوط تجلب خياراتها من موارد أخرى: فلتر نوع النموذج يحتاج `FORM_TYPES:VIEW`، ونوع الجرم `CRIME_TYPES:VIEW`، والمنظِّم `USERS:VIEW`. أخفِ الفلتر الذي لا يملك المستخدم صلاحيته، والقائمة تعمل بدونه.

#### أنواع نماذج الضبوط — `FORM_TYPES`

| الصلاحية | ما يستطيعه | في الواجهة | يحتاج معها | الـ endpoints |
|---|---|---|---|---|
| `FORM_TYPES:VIEW` | عرض شجرة أنواع نماذج الضبوط ونموذج كل نوع، وطباعة النموذج فارغاً | رابط «أنواع النماذج»، عرض نموذج النوع وزر طباعته فارغاً | — | كل `GET` تحت `/form-types`، و`GET /report-templates` |
| `FORM_TYPES:CREATE` | إضافة نوع رئيسي أو فرعي | زر «نوع جديد» | `FORM_TYPES:VIEW` | `POST /form-types` |
| `FORM_TYPES:UPDATE` | تعديل النوع (اسمه وعدد شهوده ومكانه في الشجرة)، وإنشاء نموذجه أو استبداله أو حذفه | زر «تعديل» على النوع، ومحرّر النموذج بزرَّي الحفظ والحذف | `FORM_TYPES:VIEW` | `PUT /form-types/{id}`، `PUT` و`DELETE /form-types/{id}/template` |
| `FORM_TYPES:DELETE` | حذف نوع ليس تحته أنواع فرعية ولا ضبوط | زر «حذف» على النوع | `FORM_TYPES:VIEW` | `DELETE /form-types/{id}` |

#### أنواع الجرم — `CRIME_TYPES`

| الصلاحية | ما يستطيعه | في الواجهة | يحتاج معها | الـ endpoints |
|---|---|---|---|---|
| `CRIME_TYPES:VIEW` | عرض قائمة أنواع الجرم | رابط «أنواع الجرم» | — | `GET /crime-types`، `/crime-types/{id}` |
| `CRIME_TYPES:CREATE` | إضافة نوع جرم | زر «نوع جرم جديد» | `CRIME_TYPES:VIEW` | `POST /crime-types` |
| `CRIME_TYPES:UPDATE` | تعديل اسم نوع جرم | زر «تعديل» على النوع | `CRIME_TYPES:VIEW` | `PUT /crime-types/{id}` |
| `CRIME_TYPES:DELETE` | حذف نوع جرم لا يستخدمه أي ضبط | زر «حذف» على النوع | `CRIME_TYPES:VIEW` | `DELETE /crime-types/{id}` |

#### المستخدمون — `USERS`

| الصلاحية | ما يستطيعه | في الواجهة | يحتاج معها | الـ endpoints |
|---|---|---|---|---|
| `USERS:VIEW` | عرض المستخدمين وبياناتهم وأدوارهم | رابط «المستخدمون»، وفلتر «المنظِّم» في قائمة الضبوط | — | `GET /users`، `/users/{id}` |
| `USERS:CREATE` | إنشاء حساب جديد بدور لا يتجاوز صلاحياته هو | زر «مستخدم جديد» ونموذجه بقائمة الأدوار | `USERS:VIEW`، `ROLES:VIEW` | `POST /users`، `POST /auth/register` |
| `USERS:UPDATE` | تغيير دور المستخدم وتعطيل حسابه أو تفعيله وتعديل معلومات موقعه، لمن لا يتجاوز دورُه صلاحياته هو | أزرار «تغيير الدور» و«تعطيل/تفعيل» و«معلومات الموقع» على المستخدم | `USERS:VIEW`، `ROLES:VIEW` | `PUT /users/{id}/role`، `PUT /users/{id}/enabled`، `PUT /users/{id}/report-info` |
| `USERS:DELETE` | حذف حساب لا يتجاوز دورُه صلاحياته هو وليست له ضبوط، عدا آخر مدير نظام | زر «حذف» على المستخدم | `USERS:VIEW` | `DELETE /users/{id}` |

#### الأدوار والصلاحيات — `ROLES`

| الصلاحية | ما يستطيعه | في الواجهة | يحتاج معها | الـ endpoints |
|---|---|---|---|---|
| `ROLES:VIEW` | عرض الأدوار وصلاحيات كل دور | رابط «الأدوار والصلاحيات» للقراءة، وقائمة الأدوار في نموذج المستخدم | — | `GET /roles`، `/roles/{id}` |
| `ROLES:CREATE` | إنشاء دور جديد بصلاحيات لا تتجاوز صلاحياته هو | زر «دور جديد» ومصفوفة الصلاحيات | `ROLES:VIEW` | `POST /roles` |
| `ROLES:UPDATE` | تعديل اسم الدور وصلاحياته ضمن صلاحياته هو، عدا دور مدير النظام | تعديل اسم الدور ومصفوفته؛ عطّله لدور مدير النظام (`builtIn: "ADMIN"`) | `ROLES:VIEW` | `PUT /roles/{id}` |
| `ROLES:DELETE` | حذف دور غير مسند لأي مستخدم، عدا الأدوار المدمجة | زر «حذف» على الدور؛ أخفِه للأدوار المدمجة (`builtIn` ليس `null`) | `ROLES:VIEW` | `DELETE /roles/{id}` |

**دون أي صلاحية** يستطيع كل مستخدم مسجّل: عرض حسابه (`GET /users/me`)، وتعيين معلومات موقعه (`PUT /users/me/report-info`)، وجلب قوائم الخيارات (`GET /reports/options`، `GET /roles/options`).

**قد يُرفض الطلب رغم الصلاحية**: `403` حين يتجاوز الدور المعنيّ صلاحيات المنفّذ (القسم 4.4)، و`409` لضبط مختوم أو لآخر مدير نظام أو لسجل تستخدمه سجلات أخرى. أظهر رسالة الخطأ كما هي.

### 4.2 الأدوار المدمجة

| الدور | `builtIn` | الصلاحيات | القيود |
|---|---|---|---|
| مدير النظام | `ADMIN` | كل الصلاحيات دائماً، ويأخذ تلقائياً أي مورد يُضاف في إصدار لاحق | لا يُعدَّل ولا يُحذف (`409`) |
| مستخدم | `USER` | يبدأ باستعراض الضبوط وإضافتها وتعديلها، واستعراض أنواع النماذج وأنواع الجرم والمستخدمين | يأخذه كل حساب يُنشأ عبر `/auth/register`. يُعدَّل اسمه وصلاحياته، ولا يُحذف (`409`) |

المستخدمون الموجودون قبل إضافة الأدوار نُقلوا تلقائياً عند الإقلاع: `ADMIN` إلى مدير النظام، و`USER` إلى مستخدم. الأدوار الأخرى (`builtIn: null`) تُنشأ وتُعدّل وتُحذف بحرية.

> ⚠️ `USER` كان يستطيع حذف أي مستخدم؛ هذا صار يحتاج `USERS:DELETE`، ولا يملكها دور «مستخدم» افتراضياً.

أمثلة لأدوار يمكن للمدير إنشاؤها:

| الدور | الصلاحيات | النتيجة |
|---|---|---|
| ضابط منظِّم | `REPORTS`: `VIEW` `CREATE` `UPDATE`؛ `FORM_TYPES`: `VIEW`؛ `CRIME_TYPES`: `VIEW` | ينظّم الضبوط ويعدّلها ويطبعها، دون حذفها أو إدارة غيرها |
| مراقب | `VIEW` على `REPORTS` و`FORM_TYPES` و`CRIME_TYPES` | يطّلع على الضبوط والإحصائيات ويطبعها ويصدّرها، دون أي تعديل |
| مسؤول المستخدمين | كل عمليات `USERS`، و`ROLES`: `VIEW` | يدير الحسابات، لكنه لا يُسند إلا أدواراً لا تتجاوز صلاحياته؛ فليُسند دور «ضابط منظِّم» يجب أن يملك صلاحياته أيضاً |

### 4.3 شكل الصلاحيات في الـ JSON

`permissions` كائن مفاتيحه **كل الموارد دائماً** (حتى التي لا عمليات لها)، وقيمه العمليات الممنوحة:

```json
{ "REPORTS": ["VIEW", "CREATE", "UPDATE"], "FORM_TYPES": ["VIEW"], "CRIME_TYPES": ["VIEW"], "USERS": ["VIEW"], "ROLES": [] }
```

يصل في استجابة الدخول وفي `GET /users/me`، فاستخدمه لإظهار/إخفاء الشاشات والأزرار كما في القسم 4.1:

```ts
const can = (p: Permissions, resource: Resource, action: Action) => p[resource].includes(action);
```

الـ Backend يقرأ صلاحيات الدور من قاعدة البيانات مع **كل طلب**، فتعديل دور أو نقل مستخدم إلى دور آخر يسري فوراً دون إعادة دخول. الواجهة لا تعرف بذلك حتى تعيد جلب `/users/me`، لذا عالج `403` دائماً.

### 4.4 قواعد تمنع التصعيد

- **لا يمنح أحد ما لا يملك**: إنشاء دور أو تعديله بصلاحية لا يملكها المنفّذ، أو إسناد دور كهذا لمستخدم (عند إنشائه أو تغيير دوره)، يُرجع `403`.
- **لا يتصرف أحد بمن هو أعلى منه**: تغيير دور مستخدم أو تعطيله أو حذفه أو تعديل معلومات موقعه، وكذلك تعديل دور، يُرجع `403` إن كان الدور يمنح صلاحية لا يملكها المنفّذ.
- **لا يبقى النظام بلا مدير**: نقل آخر مستخدم مفعّل من دور مدير النظام أو تعطيله أو حذفه يُرجع `409`.

لذلك من يملك `USERS:*` وحدها يستطيع إسناد الأدوار التي لا تتجاوز صلاحياته فقط.

### 4.5 إدارة الأدوار — `/api/v1/roles`

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/roles` | `ROLES:VIEW` | كل الأدوار | `RoleResponse[]` |
| `GET` | `/roles/options` | — | الموارد والعمليات مع تسمياتها العربية، وشرح كل صلاحية وما تحتاجه، لبناء محرر الأدوار | `RoleOptionsResponse` |
| `GET` | `/roles/{id}` | `ROLES:VIEW` | دور واحد | `RoleResponse` أو `404` |
| `POST` | `/roles` | `ROLES:CREATE` | إنشاء | `201` `RoleResponse` |
| `PUT` | `/roles/{id}` | `ROLES:UPDATE` | استبدال الاسم والصلاحيات | `RoleResponse`، أو `409` لدور مدير النظام |
| `DELETE` | `/roles/{id}` | `ROLES:DELETE` | حذف | `204`، أو `409` لدور مدمج أو دور مسند لمستخدمين |

جسم الإنشاء/التعديل:

```json
{
  "name": "ضابط مخفر",
  "permissions": { "REPORTS": ["VIEW", "CREATE", "UPDATE"], "FORM_TYPES": ["VIEW"], "CRIME_TYPES": ["VIEW"] }
}
```

- `name` مطلوب وفريد (حتى 100 حرف)، والتكرار يُرجع `409`.
- المورد الغائب عن `permissions` لا يأخذ أي عملية. مورد أو عملية غير معروفة تُرجع `400`.
- `PUT` يستبدل الصلاحيات كلها، فأرسل المصفوفة كاملة.

`RoleResponse`:

```json
{
  "id": 3,
  "name": "ضابط مخفر",
  "builtIn": null,
  "permissions": { "REPORTS": ["VIEW", "CREATE", "UPDATE"], "FORM_TYPES": ["VIEW"], "CRIME_TYPES": ["VIEW"], "USERS": [], "ROLES": [] }
}
```

`GET /roles/options`: صفوف المصفوفة وأعمدتها بترتيب العرض، وفي `permissions` عنصر لكل خانة من الخانات العشرين:

```json
{
  "resources": [ { "value": "REPORTS", "label": "الضبوط" }, { "value": "FORM_TYPES", "label": "أنواع نماذج الضبوط" }, "…" ],
  "actions": [ { "value": "VIEW", "label": "استعراض" }, { "value": "CREATE", "label": "إضافة" }, { "value": "UPDATE", "label": "تعديل" }, { "value": "DELETE", "label": "حذف" } ],
  "permissions": [
    {
      "resource": "REPORTS",
      "action": "VIEW",
      "description": "عرض قائمة الضبوط والبحث فيها وفتح أي ضبط، وطباعة ورقة الضبط، وعرض الإحصائيات، وتصدير سجل الضبوط إلى Excel",
      "requires": {}
    },
    {
      "resource": "REPORTS",
      "action": "CREATE",
      "description": "تنظيم ضبط جديد، ويُسجَّل المستخدم منظِّماً له",
      "requires": { "REPORTS": ["VIEW"], "FORM_TYPES": ["VIEW"], "CRIME_TYPES": ["VIEW"] }
    },
    "…"
  ]
}
```

- اعرض `description` بجانب كل خانة (تلميحاً أو سطراً تحتها) ليعرف المدير ما يمنحه.
- `requires` تحوي الموارد المطلوبة فقط. حين يفعّل المدير خانة، فعّل معها ما تحتاجه، وحين يلغي خانة تحتاجها خانة أخرى مفعّلة، نبّهه:

```ts
// تفعيل خانة في محرر الأدوار مع ما تحتاجه
function grant(p: Permissions, option: PermissionOption): Permissions {
  const next = structuredClone(p);
  const add = (r: Resource, a: Action) => { if (!next[r].includes(a)) next[r].push(a); };
  add(option.resource, option.action);
  for (const [r, actions] of Object.entries(option.requires) as [Resource, Action[]][]) {
    actions.forEach((a) => add(r, a));
  }
  return next;
}
```

---

## 5. المستخدمون — `/api/v1/users`

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/users` | `USERS:VIEW` | كل المستخدمين | `UserResponse[]` |
| `GET` | `/users/{id}` | `USERS:VIEW` | مستخدم واحد | `UserResponse` أو `404` |
| `GET` | `/users/me` | — | المستخدم الحالي **مع `permissions`** | `UserResponse` |
| `POST` | `/users` | `USERS:CREATE` | إنشاء حساب بدور محدد | `201` `UserResponse` |
| `PUT` | `/users/{id}/role` | `USERS:UPDATE` | نقل المستخدم إلى دور آخر | `UserResponse` |
| `PUT` | `/users/{id}/enabled` | `USERS:UPDATE` | **تعطيل الحساب أو تفعيله**: المعطّل يفقد الوصول فوراً، توكناته الحالية ضمناً | `UserResponse` |
| `PUT` | `/users/me/report-info` | — | تعيين معلومات الموقع للمستخدم الحالي | `UserResponse` |
| `PUT` | `/users/{id}/report-info` | `USERS:UPDATE` | تعيينها لأي مستخدم | `UserResponse` |
| `DELETE` | `/users/{id}` | `USERS:DELETE` | حذف | `204` أو `404`، أو `409` لآخر مدير نظام أو لمستخدم له تقارير |

قيود القسم 4.4 تنطبق على `POST /users` و`POST /auth/register` و`PUT /users/{id}/role` و`PUT /users/{id}/enabled` و`PUT /users/{id}/report-info` و`DELETE /users/{id}`.

جسم `POST /users`:

```json
{
  "fullName": "المساعد أول محمود الخطيب",
  "email": "mahmoud@example.com",
  "password": "12345678",
  "roleId": 3,
  "reportInfo": { "governorate": "ريف دمشق", "district": "دوما", "subDistrict": "حرستا", "department": "قسم شرطة دوما", "policeStation": "مخفر شرطة حرستا" }
}
```

`fullName` و`email` و`password` و`roleId` مطلوبة، و`reportInfo` اختياري. جسم `PUT /users/{id}/role`: `{ "roleId": 3 }`. جسم `PUT /users/{id}/enabled`: `{ "enabled": false }` للتعطيل، و`true` للتفعيل.

في `UserResponse` صار `role` كائناً `{ "id": 3, "name": "ضابط مخفر", "builtIn": null }`. أما `permissions` فلا يظهر إلا في `GET /users/me`.

جسم `PUT .../report-info` (الحقول الخمسة كلها مطلوبة):

```json
{
  "governorate": "بغداد",
  "district": "الكرخ",
  "subDistrict": "المنصور",
  "department": "قسم 1",
  "policeStation": "مخفر المنصور"
}
```

| الحقل | المعنى |
|---|---|
| `governorate` | محافظة |
| `district` | منطقة |
| `subDistrict` | ناحية |
| `department` | قسم |
| `policeStation` | مخفر شرطة |

هذه المعلومات تُخزَّن **مرة واحدة على مستوى المستخدم**، وتظهر تلقائياً داخل `creator` و`editor` في كل تقرير. لا تُرسل مع التقرير.

---

## 6. أنواع نماذج الضبوط — `/api/v1/form-types`

> كانت هذه الأنواع تُسمّى «نوع الضبط» تحت المسار `/report-types` وحقل `reportTypeId`. أصبحت الآن **نوع نموذج الضبط** (`/form-types`، `formTypeId`، `formType`)، بينما **نوع الضبط** صار حقلاً ثابتاً `type` في التقرير نفسه (القسم 7.1).

الأنواع تشكّل **شجرة**: كل نوع له `parentId` اختياري.

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/form-types` | `FORM_TYPES:VIEW` | قائمة مسطّحة (كل نوع مع `parentId`) | `FormTypeResponse[]` |
| `GET` | `/form-types/tree` | `FORM_TYPES:VIEW` | الجذور مع `children` متداخلة إلى أي عمق | `FormTypeResponse[]` |
| `GET` | `/form-types/roots` | `FORM_TYPES:VIEW` | **الأنواع الرئيسية وحدها** مع عدد فروع كل نوع | `FormTypeResponse[]` |
| `GET` | `/form-types/{id}` | `FORM_TYPES:VIEW` | نوع واحد | `FormTypeResponse` |
| `GET` | `/form-types/{id}/children` | `FORM_TYPES:VIEW` | الأبناء المباشرون | `FormTypeResponse[]` |
| `POST` | `/form-types` | `FORM_TYPES:CREATE` | إنشاء | `201` `FormTypeResponse` |
| `PUT` | `/form-types/{id}` | `FORM_TYPES:UPDATE` | تعديل كامل | `FormTypeResponse` |
| `DELETE` | `/form-types/{id}` | `FORM_TYPES:DELETE` | حذف | `204`، أو `409` إن كان له أبناء أو تقارير |

جسم الإنشاء/التعديل:

```json
{ "name": "ضبط تحقيق حول حريق", "witnessNumber": 2, "parentId": 4 }
```

- `name` مطلوب وفريد (حتى 100 حرف)، `witnessNumber` مطلوب وعدد صحيح ≥ 0.
- `parentId` اختياري. غيابه (أو `null`) يعني نوعاً جذرياً. في `PUT` غيابه **يحوّل النوع إلى جذر**، فأرسله دائماً إن أردت إبقاء الأب.
- جعل النوع أباً لنفسه أو وضعه تحت أحد أحفاده يُرجع `400`.

`childrenCount` يأتي مع كل نوع في `/form-types`، `/roots`، `/tree`، `/{id}` و`/{id}/children`:

- **أكبر من صفر** ← نوع رئيسي (تصنيف). لا يُقبل في `formTypeId`؛ ادخل إلى فروعه.
- **صفر** ← نوع فرعي قابل للاختيار عند إنشاء ضبط، وله نموذج.

مثال استجابة `/form-types/roots` (كل ما تحتاجه شاشة «اختر نموذج الضبط» في طلب واحد):

```json
[
  { "id": 1, "name": "الضبوط الإدارية",           "witnessNumber": 0, "childrenCount": 7 },
  { "id": 2, "name": "ضبوط بموجب مذكرات قضائية", "witnessNumber": 0, "childrenCount": 3 },
  { "id": 3, "name": "ضبوط حوادث سير",            "witnessNumber": 0, "childrenCount": 3 },
  { "id": 4, "name": "ضبوط بجرائم مشهودة",        "witnessNumber": 0, "childrenCount": 6 },
  { "id": 5, "name": "ضبوط بجرائم مخدرات",        "witnessNumber": 0, "childrenCount": 3 }
]
```

ثم `GET /form-types/{id}/children` لعرض فروع التصنيف الذي اختاره المستخدم، أو `/tree` إن أردت الشجرة كاملة دفعة واحدة:

```json
[
  {
    "id": 1, "name": "الضبوط الإدارية", "witnessNumber": 0, "childrenCount": 7,
    "children": [
      { "id": 6, "name": "ضبط تحقيق حول وفاة مكتومة", "witnessNumber": 2, "parentId": 1, "childrenCount": 0, "children": [] },
      { "id": 7, "name": "ضبط تحقيق حول ولادة مكتومة", "witnessNumber": 2, "parentId": 1, "childrenCount": 0, "children": [] }
    ]
  }
]
```

> في القائمة المسطّحة لا يظهر حقل `children` إطلاقاً، وفي الجذور لا يظهر `parentId`. عامل الحقول الغائبة كـ `undefined`.

### 6.1 الأنواع المزروعة افتراضياً

عند أول إقلاع تُزرع شجرة أنواع الضبوط المأخوذة من «نماذج ضبوط — قواعد تنظيم الضبوط ٢٠٢١»:
**٥ أنواع رئيسية** (جذور) و**٢٢ نوعاً فرعياً** تحتها، ولكل نوع فرعي **نموذج (قالب)** جاهز.

| النوع الرئيسي | الأنواع الفرعية |
|---|---|
| الضبوط الإدارية | وفاة مكتومة، ولادة مكتومة، تلف بطاقة شخصية، فقدان بطاقة شخصية، وحدانية مكلف، بيان وضع راهن، تقديم المؤازرة |
| ضبوط بموجب مذكرات قضائية | كتاب نشرة شرطية، مذكرة حكم، مذكرة قبض |
| ضبوط حوادث سير | تصادم سيارتين، تدهور سيارة، صدم امرأة |
| ضبوط بجرائم مشهودة | قتل عمداً، السمسرة، حفر بئر دون ترخيص، مشاجرة جماعية، قتل قصداً، سرقة عادية |
| ضبوط بجرائم مخدرات | تعاطي الهروئين المخدر، تعاطي الحشيش المخدر، الاتجار والتعامل بالمخدرات |

الزرع **إضافي** ويطابق على الاسم، فإعادة الإقلاع لا تستبدل نوعاً أو نموذجاً عدّلته عبر الـ API.
استخدم `GET /form-types/tree` للحصول على المعرّفات الفعلية بدل تثبيتها في الواجهة.

### 6.2 نماذج الضبوط (القوالب) — `/api/v1/form-types/{id}/template`

لكل نوع فرعي نموذج يحمل نص ورقة الضبط الرسمية بفراغاتها (`....`).

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/report-templates` | `FORM_TYPES:VIEW` | كل النماذج | `ReportTemplateResponse[]` |
| `GET` | `/form-types/{id}/template` | `FORM_TYPES:VIEW` | نموذج نوع محدّد | `ReportTemplateResponse` أو `404` |
| `PUT` | `/form-types/{id}/template` | `FORM_TYPES:UPDATE` | إنشاء النموذج أو استبداله | `ReportTemplateResponse` |
| `DELETE` | `/form-types/{id}/template` | `FORM_TYPES:UPDATE` | حذف النموذج | `204` أو `404` |
| `GET` | `/form-types/{id}/template/pdf` | `FORM_TYPES:VIEW` | **النموذج فارغاً كورقة ضبط للطباعة** | `application/pdf` أو `404` |

```json
{
  "id": 1, "formTypeId": 6, "formTypeName": "ضبط تحقيق حول وفاة مكتومة",
  "creator": "المساعد أول محمود ....",
  "writer": "الشرطي علي ...........",
  "copyLabel": "النسخة الثانية",
  "summary": "تحقيق حول وفاة المدعوة نعيمة بنت .... بمشفى .... وفاة طبيعية …",
  "referral": "تحال من الرائد ..... مدير ناحية ....\nإلى قيادة شرطة …\n.... في 2011/1/15 م\nمدير ناحية ....\nالرائد ....\nالخاتم والتوقيع",
  "introduction": "في هذا اليوم …",
  "body": "# إفادة مقدم الشهادة المدعو مازن ....\nاسمي مازن بن …\n@شرطي\tشرطي\tمساعد أول\tصاحب الإفادة",
  "conclusion": "الضبط على نسختين الأولى …"
}
```

ترميز النصوص داخل الأقسام موضّح في القسم 7.6، وهو نفسه للنموذج وللتقرير.

**الوسوم البديلة**: يمكن وضع `{{token}}` داخل أي قسم، ويُستبدل عند تصدير **التقرير** إلى PDF:
`reportNumber`, `reportDate`, `typeName`, `creator`, `writer`,
`governorate`, `district`, `subDistrict`, `department`, `policeStation`.
الوسم غير المعروف يبقى كما هو ليظهر الخطأ بدل أن يُفرَّغ الحقل بصمت.

### 6.3 أنواع الجرم — `/api/v1/crime-types`

قائمة مسطّحة يديرها من يملك صلاحيات `CRIME_TYPES`، ويُختار منها `crimeTypeId` في التقرير.

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/crime-types` | `CRIME_TYPES:VIEW` | كل الأنواع بترتيب الإضافة | `CrimeTypeResponse[]` |
| `GET` | `/crime-types/{id}` | `CRIME_TYPES:VIEW` | نوع واحد | `CrimeTypeResponse` أو `404` |
| `POST` | `/crime-types` | `CRIME_TYPES:CREATE` | إنشاء | `201` `CrimeTypeResponse` |
| `PUT` | `/crime-types/{id}` | `CRIME_TYPES:UPDATE` | تعديل | `CrimeTypeResponse` |
| `DELETE` | `/crime-types/{id}` | `CRIME_TYPES:DELETE` | حذف | `204`، أو `409` إن كانت تقارير تستخدمه |

```json
{ "name": "سرقات متنوعة" }
```

- `name` مطلوب وفريد (حتى 150 حرفاً). التكرار يُرجع `409`.
- عند أول إقلاع (والجدول فارغ) تُزرع **٧٣ نوعاً** بدءاً من «قتل» وانتهاءً بـ«جرائم أخرى». بعد ذلك القائمة ملك من يديرها: ما يُحذف أو يُعدَّل منها لا يعود عند إعادة الإقلاع.

---

## 7. التقارير — `/api/v1/reports`

| Method | Path | الصلاحية | الوصف | الاستجابة |
|---|---|---|---|---|
| `GET` | `/reports` | `REPORTS:VIEW` | قائمة مُرقّمة مع فلاتر | `Page<ReportResponse>` |
| `GET` | `/reports/statistics?from=&to=` | `REPORTS:VIEW` | **إحصائيات** عدد الضبوط حسب النوع والنموذج والجرم والاكتشاف والنتيجة (القسم 7.7) | `ReportStatisticsResponse` |
| `GET` | `/reports/export` | `REPORTS:VIEW` | **سجل الضبوط كملف Excel** بفلاتر القائمة نفسها (القسم 7.8) | `.xlsx` |
| `GET` | `/reports/options` | — | قيم الحقول الثابتة (نوع الضبط، إذاعة البحث، النتيجة) مع تسمياتها العربية | `ReportOptionsResponse` |
| `GET` | `/reports/{id}` | `REPORTS:VIEW` | تقرير واحد | `ReportResponse` أو `404` |
| `POST` | `/reports` | `REPORTS:CREATE` | إنشاء؛ `creator` يُضبط تلقائياً من التوكن | `201` `ReportResponse` |
| `PUT` | `/reports/{id}` | `REPORTS:UPDATE` | تعديل كامل؛ `editor` يُضبط تلقائياً | `ReportResponse`، أو `409` إن كانت النتيجة `CLOSED` |
| `PATCH` | `/reports/{id}/result` | `REPORTS:UPDATE` | **تغيير النتيجة وحدها** (القسم 7.2.1) | `ReportResponse`، أو `409` إن كانت النتيجة `CLOSED` |
| `DELETE` | `/reports/{id}` | `REPORTS:DELETE` | حذف | `204` أو `404`، أو `409` إن كانت النتيجة `CLOSED` |
| `GET` | `/reports/{id}/pdf?copy=1` | `REPORTS:VIEW` | **التقرير كورقة ضبط للطباعة** بالقالب الرسمي | `application/pdf` أو `404` |

### 7.1 جسم الإنشاء/التعديل

```json
{
  "reportNumber": "2026/114",
  "reportDate": "2026-09-06",
  "type": "CRIMINAL",
  "formTypeId": 6,
  "crimeTypeId": 21,
  "searchBroadcast": "PRESENT",
  "prosecutionPermission": true,
  "discovered": false,
  "result": "UNDER_INVESTIGATION",
  "plaintiff": {
    "name": "أحمد محمد", "motherName": "فاطمة", "nationalId": "01020304050",
    "origin": "حمص", "residence": "دمشق - المزة"
  },
  "defendant": { "name": "مجهول" },
  "crimePlace": "سوق الحميدية",
  "crimeDate": "2026-09-05",
  "actionTaken": "تنظيم الضبط وإحالته إلى النيابة",
  "confiscation": {
    "weapons": "مسدس حربي", "vehicles": null, "drugs": null,
    "money": "500,000 ل.س", "seizedItems": null, "notes": "سُلّمت للأمانات"
  },
  "introduction": "…",
  "body": "…",
  "referral": "…",
  "conclusion": "…",
  "summary": "…"
}
```

| الحقل | مطلوب | ملاحظات |
|---|---|---|
| `reportNumber` | ✅ | فريد، حتى 100 حرف. التكرار يُرجع `409` |
| `type` | ✅ | **نوع الضبط**: إحدى قيم القسم 7.2 |
| `formTypeId` | ✅ | **نوع نموذج الضبط**. يجب أن يكون **نوعاً فرعياً** موجوداً: غير موجود → `404`، نوع رئيسي (له أبناء) → `400` |
| `reportDate` | ✅ | **تاريخ الضبط** بصيغة `YYYY-MM-DD`، في `POST` و`PUT` |
| `crimeTypeId` | ❌ | **نوع الجرم** من `/crime-types` (القسم 6.3). غير موجود → `404`. **لضبط بدون جرم** لا ترسله أو أرسله `null` (وليس `0`). **وجوده يجعل `crimePlace` و`crimeDate` مطلوبين** |
| `searchBroadcast` | ❌ | **إذاعة البحث**: `PRESENT` أو `ABSENT` |
| `prosecutionPermission` | ❌ | **إذن النيابة**، `true`/`false`. غيابه = `false` |
| `discovered` | ❌ | **مكتشف** (`true`) أو **غير مكتشف** (`false`). غيابه = `false` |
| `result` | ✅ | **النتيجة**: إحدى قيم القسم 7.2، في `POST` و`PUT` |
| `plaintiff` / `defendant` | ❌ | **المدعي** / **المدعى عليه**، كائن بالحقول: `name` الاسم (200)، `motherName` اسم الأم (100)، `nationalId` الرقم الوطني (50)، `origin` البلد الأصلي (100)، `residence` مكان الإقامة (255). كلها اختيارية |
| `crimePlace` | مع `crimeTypeId` | **مكان الجرم**، حتى 255 حرفاً. مطلوب وغير فارغ متى أُرسل `crimeTypeId`، واختياري بدونه |
| `crimeDate` | مع `crimeTypeId` | **تاريخ الجرم** بصيغة `YYYY-MM-DD`. مطلوب متى أُرسل `crimeTypeId`، واختياري بدونه |
| `actionTaken` | ❌ | **الإجراء المتخذ**، نص حر |
| `confiscation` | ❌ | **المصادرات**، للحفظ والعرض فقط: `weapons` مصادرات السلاح، `vehicles` مصادرات الآليات، `drugs` مصادرات المخدرات، `money` مصادرات المال، `seizedItems` المحجوزات، `notes` الملاحظات. كلها نصوص حرة اختيارية |
| `introduction`, `body`, `referral`, `conclusion`, `summary` | ❌ | نصوص حرّة بلا حد، تُطبع في الـ PDF وفق ترميز القسم 7.6 |

- **المطلوب دائماً خمسة حقول**: `reportNumber`، `reportDate`، `type`، `formTypeId`، `result`؛ ومعها `crimePlace` و`crimeDate` متى أُرسل `crimeTypeId`. كل ما عداها اختياري، بما فيه نصوص النموذج والمدعي والمدعى عليه والمصادرات.
- القواعد نفسها في `POST` و`PUT`، وكل الحقول الناقصة تعود معاً في `fieldErrors` بالطلب نفسه، مثلاً `{ "crimePlace": "must not be blank when crimeTypeId is set", "crimeDate": "must not be null when crimeTypeId is set" }`.
- `PUT` يستبدل الحقول كلها: أي حقل غير مُرسل يصبح `null` أو `false`. أرسل الكائن كاملاً.
- `confiscation`: غيابه أو `null` أو كل حقوله فارغة يعني **لا مصادرات**، فيُحذف سجل المصادرات إن وُجد.
- `creator` لا يتغيّر أبداً بعد الإنشاء. `editor` هو آخر من عدّل.

> **نموذج الضبط مطلوب أن يكون فرعياً:** لا يُقبل `formTypeId` يشير إلى **نوع رئيسي**
> (أي نوع له أبناء، مثل «الضبوط الإدارية» أو «ضبوط حوادث سير») في `POST` ولا في `PUT`،
> ويُرجع `400` مع رسالة توضّح اسم النوع. استخدم `GET /form-types/roots` ثم `/{id}/children`:
> الجذور تصنيفات، وما تحتها هو ما يُختار منه.

> **البدء من النموذج:** إذا أرسلت `POST /reports` وكل حقول النص فارغة
> (`introduction`, `body`, `referral`, `conclusion`, `summary`)، فالتقرير يُملأ تلقائياً
> من نموذج النوع المختار بنصه الرسمي وفراغاته. أرسل أي حقل نصي لتعطيل ذلك والاحتفاظ بما أرسلته.

### 7.2 الحقول الثابتة (enums) وختم الضبط

تُرسل القيم وتُستقبل بالإنجليزية كما في الجدول، وتُعرض بالتسمية العربية:

| الحقل | القيمة | التسمية |
|---|---|---|
| `type` نوع الضبط | `JUDICIAL` | عدلي |
| | `ADMINISTRATIVE` | إداري |
| | `RESISTANCE` | ضبط ممانعة |
| | `CRIMINAL` | ضبط جرمي |
| | `DETENTION_RELEASE` | فك احتباس |
| `searchBroadcast` إذاعة البحث | `PRESENT` | موجودة |
| | `ABSENT` | غير موجودة |
| `result` النتيجة | `CLOSED` | تم ختم الضبط |
| | `UNDER_INVESTIGATION` | قيد التحقيق |
| | `FURTHER_INVESTIGATION` | استكمال التحقيق |

بدل تثبيت التسميات في الواجهة، اجلبها من `GET /reports/options`:

```json
{
  "types": [ { "value": "JUDICIAL", "label": "عدلي" }, { "value": "ADMINISTRATIVE", "label": "إداري" }, "…" ],
  "searchBroadcasts": [ { "value": "PRESENT", "label": "موجودة" }, { "value": "ABSENT", "label": "غير موجودة" } ],
  "results": [ { "value": "CLOSED", "label": "تم ختم الضبط" }, "…" ]
}
```

قيمة غير معروفة في الجسم تُرجع `400` (`Malformed request body`)، وفي معاملات الاستعلام `400` (`Invalid value for parameter …`).

> **ختم الضبط:** حين تصبح `result` مساوية لـ `CLOSED` يصبح التقرير **للقراءة فقط**:
> أي `PUT` أو `DELETE` عليه يُرجع `409` برسالة `Report {id} is closed (تم ختم الضبط) and can no longer be edited or deleted`،
> حتى لمدير النظام، ولا يمكن إرجاعه إلى نتيجة أخرى. القراءة وتصدير الـ PDF يعملان كالمعتاد.
> الختم يتم بـ `PATCH /reports/{id}/result` (القسم 7.2.1) أو بـ `PUT` يرسل `"result": "CLOSED"`. أخفِ أزرار التعديل والحذف وتغيير النتيجة في الواجهة متى كانت `result === 'CLOSED'`.

#### 7.2.1 تغيير النتيجة وحدها — `PATCH /api/v1/reports/{id}/result`

يغيّر **النتيجة فقط** دون إرسال الضبط كاملاً، ويبقى كل ما عداها كما هو، ويُضبط `editor` على المستخدم الحالي.

```json
{ "result": "CLOSED" }
```

| الحالة | الاستجابة |
|---|---|
| النتيجة الحالية ليست `CLOSED` | `200` بجسم `ReportResponse` المحدَّث |
| النتيجة الحالية `CLOSED` (تم ختم الضبط) | `409`، ولا تتغيّر، حتى إلى `CLOSED` نفسها |
| `result` غائب أو `null` | `400` مع `fieldErrors.result` |
| قيمة غير معروفة | `400` |
| الضبط غير موجود | `404` |

فالانتقال مسموح بين «قيد التحقيق» و«استكمال التحقيق» في الاتجاهين، ومنهما إلى «تم ختم الضبط»، ولا خروج من «تم ختم الضبط».

### 7.3 معاملات الاستعلام في `GET /reports`

| Parameter | النوع | الوصف |
|---|---|---|
| `page` | int | رقم الصفحة، يبدأ من `0` (افتراضي `0`) |
| `size` | int | حجم الصفحة (افتراضي `20`) |
| `sort` | string | مثل `reportDate,desc` أو `reportNumber,asc`. الافتراضي `reportDate,desc`. يمكن تكراره |
| `formTypeId` | long | تقارير نموذج محدد (لا يشمل الأنواع الفرعية) |
| `type` | enum | نوع الضبط، مثل `CRIMINAL` |
| `crimeTypeId` | long | نوع جرم محدد |
| `result` | enum | النتيجة، مثل `UNDER_INVESTIGATION` |
| `creatorId` | long | تقارير منشئ محدد |
| `from` | date | `reportDate >= from` بصيغة `YYYY-MM-DD` |
| `to` | date | `reportDate <= to` |

مثال:

```
GET /api/v1/reports?type=CRIMINAL&result=UNDER_INVESTIGATION&from=2026-01-01&to=2026-12-31&page=0&size=10&sort=reportDate,desc
```

قيمة تاريخ أو enum غير صالحة تُرجع `400` برسالة `Invalid value for parameter 'from': …`.

### 7.4 شكل الصفحة (Spring `Page`)

```json
{
  "content": [ /* ReportResponse[] */ ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "numberOfElements": 10,
  "first": true,
  "last": false,
  "empty": false,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "pageable": { "pageNumber": 0, "pageSize": 10, "offset": 0, "paged": true, "unpaged": false, "sort": { "...": "..." } }
}
```

الحقول المهمة للواجهة: `content`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last`.

### 7.5 مثال `ReportResponse`

```json
{
  "id": 1,
  "reportNumber": "R-2026-001",
  "reportDate": "2026-09-06",
  "type": "CRIMINAL",
  "searchBroadcast": "PRESENT",
  "prosecutionPermission": true,
  "discovered": false,
  "result": "UNDER_INVESTIGATION",
  "plaintiff": {
    "name": "أحمد محمد", "motherName": "فاطمة", "nationalId": "01020304050",
    "origin": "حمص", "residence": "دمشق - المزة"
  },
  "defendant": { "name": "مجهول", "motherName": null, "nationalId": null, "origin": null, "residence": null },
  "crimeType": { "id": 21, "name": "سرقات متنوعة" },
  "crimePlace": "سوق الحميدية",
  "crimeDate": "2026-09-05",
  "actionTaken": "تنظيم الضبط وإحالته إلى النيابة",
  "confiscation": {
    "weapons": "مسدس حربي", "vehicles": null, "drugs": null,
    "money": "500,000 ل.س", "seizedItems": null, "notes": "سُلّمت للأمانات"
  },
  "introduction": null,
  "body": "…",
  "referral": null,
  "conclusion": null,
  "summary": null,
  "formType": { "id": 6, "name": "ضبط تحقيق حول وفاة مكتومة", "witnessNumber": 2, "parentId": 1 },
  "creator": {
    "id": 2, "fullName": "أحمد علي", "email": "ahmed@example.com", "role": "USER", "enabled": true,
    "reportInfo": {
      "governorate": "بغداد", "district": "الكرخ", "subDistrict": "المنصور",
      "department": "قسم 1", "policeStation": "مخفر المنصور"
    }
  },
  "editor": null
}
```

`plaintiff`، `defendant`، `crimeType` و`confiscation` تكون `null` إن لم تُعبّأ.

### 7.6 تصدير PDF بقالب الضبط

`GET /api/v1/reports/{id}/pdf` يُرجع ملف PDF (A4، عربي) مطابقاً للنموذج الرسمي، و`GET /api/v1/form-types/{id}/template/pdf` يُرجع نموذج النوع فارغاً بالشكل نفسه:

- **العمود الأيمن**: الجمهورية العربية السورية / وزارة الداخلية / قوى الأمن الداخلي، ثم بيانات المنشئ من `creator.reportInfo` (شرطة محافظة، منطقة، ناحية، قسم، مخفر مركز شرطة)، ثم رقم الضبط والتاريخ ورقم النسخة، ثم **الخلاصة** من `summary`، ثم أسطر **الإحالة** من `referral` مكتوبة عمودياً كما في الورقة الرسمية (تحال من … إلى … في …، ثم مدير ناحية / الرائد / الخاتم والتوقيع).
- **العمود الأيسر**: اسم نوع التقرير في صندوق العنوان، المنشئ والمحرر، عنوان "ورقة ضبط"، ثم `introduction` فـ `body` فـ `conclusion` بالترتيب.
- الترويسة تُطبع على الصفحة الأولى فقط، والصفحات التالية تحتفظ بالإطار وحده.
- أسفل العمود الأيمن يبقى **شريط فارغ مخصّص للختم والتواقيع**، فلا يمتد نص الإحالة إليه مهما طال: يُصغَّر خطه ويُلَفّ تلقائياً ليبقى ضمن حدود الإطار.
- كل النصوص بمحاذاة عربية من اليمين، والفقرات مضبوطة الطرفين إلا إذا احتوت كلمة أطول من عرض العمود فتُترك بمحاذاة يمينية حتى لا تتباعد الحروف.
- الأرقام تُطبع بالأرقام العربية الهندية (٠١٢٣) تلقائياً، والتاريخ بصيغة `٢٠١١/١/١٥`.
- حقول العمود تأتي من `reportInfo` الخاص بمُنشئ التقرير، فاضبطها عبر `PUT /users/me/report-info` قبل التصدير وإلا ظهرت نقاط `..........` مكانها.

| Parameter | الوصف |
|---|---|
| `copy` | اختياري. رقم النسخة المطبوع في الترويسة: `1` → "النسخة الأولى"، `2` → "النسخة الثانية"… بدونه تُستخدم `copyLabel` من نموذج النوع، وإلا "النسخة الأولى" |

**ترميز النصوص داخل الحقول** (`introduction`, `body`, `conclusion`؛ ينطبق على التقرير والنموذج):

| الكتابة | النتيجة في الـ PDF |
|---|---|
| كل سطر (Enter) | فقرة مستقلة مضبوطة الطرفين |
| `# نص` في بداية السطر | عنوان فرعي غامق في المنتصف (مثل `# إفادة الشاهد الأول منير ....`) |
| `@دور<TAB>دور<TAB>دور` | سطر تواقيع، تُوزَّع خاناته بالتساوي من اليمين إلى اليسار (مثل `@شرطي\tمساعد أول\tصاحب الإفادة`) |
| `> نص` في بداية السطر | سطر في المنتصف (مثل `> تلونا عليه إفادته فأيدها ووقعها`) |
| `**نص**` داخل السطر | كلمات غامقة (مثل `**في هذا اليوم**`، `**أفيدكم:**`) |

في `referral` كل سطر يُطبع كسطر عمودي مستقل، **الأول عند الحافة اليسرى للعمود وما بعده إلى يمينه** كما في النموذج الرسمي، مثلاً:

```
تحال من الرائد .......... مدير ناحية ..........
إلى قيادة شرطة محافظة ريف دمشق المصنف
في 2011/1/15م
مدير ناحية ..........
الرائد ..........
الخاتم والتوقيع
```

#### تنزيل ملف الـ PDF

النقطتان تُرجعان بايتات الملف بترويستَي:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''report-2.pdf
```

**من Swagger UI:** افتح النقطة ← `Authorize` والصق التوكن ← `Try it out` ← `Execute`،
فيظهر في `Response body` رابط **Download file** يحفظ الملف باسمه مباشرة.

**من الواجهة الأمامية:** لا يمكن وضع الرابط في `<iframe>` أو `<a href>` ولا فتحه في
تبويب مباشرة، لأن المتصفح لن يرسل ترويسة `Authorization`. اجلب الملف كـ `blob` ثم اصنع منه
عنوان كائن (مثال `openReportPdf` في القسم 9):

```ts
const { data } = await api.get<Blob>(`/reports/${id}/pdf`, { params: { copy: 2 }, responseType: 'blob' });
const url = URL.createObjectURL(data);
window.open(url, '_blank');            // معاينة وطباعة
// أو: const a = document.createElement('a'); a.href = url; a.download = `ضبط-${id}.pdf`; a.click();
// أو: <iframe src={url} /> لعرضه داخل الصفحة
```

### 7.7 الإحصائيات — `GET /api/v1/reports/statistics`

عدد الضبوط ضمن فترة، مقسّماً بخمس طرق في طلب واحد.

| Parameter | النوع | الوصف |
|---|---|---|
| `from` | date | من **تاريخ الضبط** (`reportDate`) ضمناً، بصيغة `YYYY-MM-DD`. بدونه لا حد أدنى |
| `to` | date | إلى تاريخ الضبط ضمناً. بدونه لا حد أعلى |

بدون المعاملين تُحسب كل الضبوط. `from` بعد `to` يُرجع `400`.

```
GET /api/v1/reports/statistics?from=2026-03-01&to=2026-03-31
```

```json
{
  "from": "2026-03-01",
  "to": "2026-03-31",
  "total": 6,
  "byType": [
    { "key": "JUDICIAL", "label": "عدلي", "count": 1 },
    { "key": "ADMINISTRATIVE", "label": "إداري", "count": 1 },
    { "key": "RESISTANCE", "label": "ضبط ممانعة", "count": 0 },
    { "key": "CRIMINAL", "label": "ضبط جرمي", "count": 4 },
    { "key": "DETENTION_RELEASE", "label": "فك احتباس", "count": 0 }
  ],
  "byFormType": [
    { "key": 6, "label": "ضبط تحقيق حول وفاة مكتومة", "count": 3 },
    { "key": 7, "label": "ضبط تحقيق حول ولادة مكتومة", "count": 3 },
    { "key": 8, "label": "ضبط تحقيق حول تلف بطاقة شخصية", "count": 0 }
  ],
  "byCrimeType": [
    { "key": 1, "label": "قتل", "count": 3 },
    { "key": 21, "label": "سرقات متنوعة", "count": 2 },
    { "key": null, "label": "بدون جرم", "count": 1 }
  ],
  "byDiscovered": [
    { "key": true, "label": "مكتشف", "count": 3 },
    { "key": false, "label": "غير مكتشف", "count": 3 }
  ],
  "byResult": [
    { "key": "CLOSED", "label": "تم ختم الضبط", "count": 2 },
    { "key": "UNDER_INVESTIGATION", "label": "قيد التحقيق", "count": 3 },
    { "key": "FURTHER_INVESTIGATION", "label": "استكمال التحقيق", "count": 1 }
  ]
}
```

كل تقسيم قائمة بالشكل نفسه `{ key, label, count, details }`، فيكفي مكوّن جدول أو رسم واحد لها كلها (`details` مشروح في القسم 7.7.1 وحُذف من المثال أعلاه للاختصار):

| التقسيم | `key` | ما يظهر فيه | الترتيب |
|---|---|---|---|
| `byType` نوع الضبط | اسم القيمة (`CRIMINAL`…) | **كل** القيم حتى الصفرية | ترتيب القسم 7.2 |
| `byFormType` نوع النموذج | `id` النوع | **كل** الأنواع الفرعية حتى الصفرية (الرئيسية لا تحمل ضبوطاً فلا تظهر) | الأكثر أولاً |
| `byCrimeType` نوع الجرم | `id` النوع، و`null` لـ«بدون جرم» | **فقط الأنواع التي عددها أكبر من صفر**، ثم خانة **«بدون جرم»** دائماً ولو كانت صفراً | الأكثر أولاً، و«بدون جرم» أخيراً |
| `byDiscovered` الاكتشاف | `true` / `false` | مكتشف وغير مكتشف | مكتشف أولاً |
| `byResult` النتيجة | اسم القيمة (`CLOSED`…) | **كل** القيم حتى الصفرية | ترتيب القسم 7.2 |

- **مجموع `count` في كل تقسيم يساوي `total`** دائماً، لأن كل التقسيمات تُحسب من استعلام واحد.
- **الضبوط التي بلا جرم** لها خانة خاصة في آخر `byCrimeType`: `{ "key": null, "label": "بدون جرم" }`، موجودة دائماً حتى لو كان عددها صفراً.
- في `byType`/`byResult` تظهر في آخر القائمة خانة `{ "key": null, "label": "غير محدد" }` فقط إن وُجدت ضبوط قديمة أُنشئت قبل إضافة الحقلين.
- `key` هو نفسه قيمة فلتر قائمة الضبوط، فللانتقال من خانة إحصائية إلى ضبوطها: `GET /reports?crimeTypeId={key}` أو `?type={key}` أو `?formTypeId={key}` أو `?result={key}` مع `from`/`to` نفسيهما.

#### 7.7.1 الإحصائيات المفصلة (`details`)

كل خانة في المستوى الأول تحمل `details`: ضبوط تلك الخانة وحدها مقسّمة **بالتقسيمات الأربعة الأخرى**. مثلاً خانة «قتل» في `byCrimeType` تجيب: كم منها مكتشف، وكم في كل نتيجة، وكم من كل نوع ضبط ونوع نموذج.

```json
{
  "key": 1, "label": "قتل", "count": 3,
  "details": {
    "byType": [
      { "key": "JUDICIAL", "label": "عدلي", "count": 1 },
      { "key": "ADMINISTRATIVE", "label": "إداري", "count": 0 },
      { "key": "RESISTANCE", "label": "ضبط ممانعة", "count": 0 },
      { "key": "CRIMINAL", "label": "ضبط جرمي", "count": 2 },
      { "key": "DETENTION_RELEASE", "label": "فك احتباس", "count": 0 }
    ],
    "byFormType": [ { "key": 6, "label": "ضبط تحقيق حول وفاة مكتومة", "count": 2 }, "…" ],
    "byDiscovered": [
      { "key": true, "label": "مكتشف", "count": 2 },
      { "key": false, "label": "غير مكتشف", "count": 1 }
    ],
    "byResult": [
      { "key": "CLOSED", "label": "تم ختم الضبط", "count": 2 },
      { "key": "UNDER_INVESTIGATION", "label": "قيد التحقيق", "count": 1 },
      { "key": "FURTHER_INVESTIGATION", "label": "استكمال التحقيق", "count": 0 }
    ]
  }
}
```

- **تقسيم الخانة نفسها لا يتكرر** في `details`: خانات `byCrimeType` لا تحمل `details.byCrimeType`، وخانات `byResult` لا تحمل `details.byResult`، وهكذا. فكل `details` فيه أربعة تقسيمات.
- **القواعد نفسها** كالمستوى الأول: أنواع الجرم غير الصفرية فقط ثم «بدون جرم» دائماً، والقيم الثابتة والأنواع الفرعية للنموذج كاملة مع الأصفار، و«غير محدد» عند الحاجة.
- **مجموع `count` في كل تقسيم داخل `details` يساوي `count` الخانة**.
- التفصيل **مستوى واحد**: الخانات داخل `details` لا تحمل `details` (الحقل غائب تماماً).
- خانتا «بدون جرم» و«غير محدد» في المستوى الأول مفصّلتان أيضاً.

مثال لجدول جنائي تقليدي (نوع الجرم × الاكتشاف):

```ts
const stats = await reportsApi.statistics({ from, to });
const rows = stats.byCrimeType.map((c) => ({
  crime: c.label,
  total: c.count,
  discovered: c.details!.byDiscovered!.find((d) => d.key === true)!.count,
  undiscovered: c.details!.byDiscovered!.find((d) => d.key === false)!.count,
}));
```

### 7.8 تصدير سجل الضبوط إلى Excel — `GET /api/v1/reports/export`

يُرجع ملف `.xlsx` (سجل الضبوط) لكل الضبوط المطابقة، **بمعاملات الفلترة نفسها** لـ `GET /reports` (القسم 7.3) عدا الترقيم والترتيب: `formTypeId`، `type`، `crimeTypeId`، `result`، `creatorId`، `from`، `to`. بدون أي معامل تُصدَّر كل الضبوط.

```
GET /api/v1/reports/export?from=2026-03-01&to=2026-03-31
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename*=UTF-8''reports.xlsx
```

- ورقة واحدة باسم «سجل الضبوط» من اليمين إلى اليسار، صف العناوين ملوّن ومثبّت عند التمرير وعليه فلاتر Excel.
- ضبط في كل صف، مرتبة بالتاريخ **تصاعدياً**، والعمود «م» يرقّمها من 1.
- التواريخ تواريخ Excel حقيقية بصيغة `yyyy/mm/dd`، فيمكن فرزها وفلترتها داخل Excel.
- الخلية تبقى فارغة حين لا تتوفر قيمتها.

| العمود | المصدر |
|---|---|
| م | رقم الصف |
| التاريخ | `reportDate` |
| رقم الضبط | `reportNumber` |
| نوع الضبط | تسمية `type` |
| الجهة الرئيسية | `district` (المنطقة) من `reportInfo` منشئ الضبط |
| الجهة الفرعية | `subDistrict` (الناحية) من `reportInfo` منشئ الضبط |
| المدعي، اسم الام، الرقم الوطني، البلد الأصلي، مكان الإقامة | `plaintiff` |
| المدعى عليه، اسم الام2، الرقم الوطني2، البلد الأصلي 2، مكان الإقامة | `defendant` |
| إذاعة بحث | تسمية `searchBroadcast` |
| نوع الجرم | `crimeType.name` |
| مكان الجرم، تاريخ الجرم | `crimePlace`، `crimeDate` |
| إذن النيابة | `prosecutionPermission`: نعم / لا |
| الموضوع | `summary` (خلاصة الضبط) |
| الإجراء المتخذ | `actionTaken` |
| مكتشف او غير مكتشف | `discovered`: مكتشف / غير مكتشف |
| النتيجة | تسمية `result` |
| المصادرات (آليات)، (سلاح)، (مخدرات)، (مال)، المحجوزات، الملاحظات | `confiscation` |

> «الجهة» تُقرأ من بيانات موقع **المنشئ الحالية** وقت التصدير، كما في ورقة الـ PDF.

التنزيل من الواجهة كـ `blob` مثل الـ PDF (القسم 7.6):

```ts
const blob = await reportsApi.exportExcel({ from: '2026-03-01', to: '2026-03-31' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = 'سجل-الضبوط.xlsx'; a.click();
URL.revokeObjectURL(url);
```

---

## 8. نماذج TypeScript

```ts
export type Resource = 'REPORTS' | 'FORM_TYPES' | 'CRIME_TYPES' | 'USERS' | 'ROLES';

export type Action = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

/** كل الموارد موجودة دائماً كمفاتيح، وقيمة كل مورد العمليات الممنوحة عليه */
export type Permissions = Record<Resource, Action[]>;

export type BuiltInRole = 'ADMIN' | 'USER';

export interface RoleSummary {
  id: number;
  name: string;
  builtIn: BuiltInRole | null;      // null للأدوار التي يضيفها المدير
}

export interface RoleResponse extends RoleSummary {
  permissions: Permissions;
}

export interface RoleRequest {
  name: string;
  permissions: Partial<Record<Resource, Action[]>>;  // المورد الغائب = بلا عمليات
}

/** خانة من مصفوفة الصلاحيات مع شرحها (القسم 4.1) */
export interface PermissionOption {
  resource: Resource;
  action: Action;
  description: string;                            // ما يستطيعه صاحبها، يُعرض بجانب الخانة
  requires: Partial<Record<Resource, Action[]>>;  // ما تحتاجه شاشاتها؛ لا يفرضه الـ Backend
}

export interface RoleOptionsResponse {
  resources: EnumOption<Resource>[];
  actions: EnumOption<Action>[];
  permissions: PermissionOption[];                // عنصر لكل خانة (20)
}

export interface ReportInfo {
  governorate: string;   // محافظة
  district: string;      // منطقة
  subDistrict: string;   // ناحية
  department: string;    // قسم
  policeStation: string; // مخفر شرطة
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: RoleSummary | null;
  enabled: boolean;
  reportInfo: ReportInfo | null;
  permissions?: Permissions;         // موجود فقط في GET /users/me
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  reportInfo?: ReportInfo;
}

export interface CreateUserRequest extends RegisterRequest {
  roleId: number;
}

export interface UserRoleRequest {
  roleId: number;
}

export interface UserEnabledRequest {
  enabled: boolean;
}

export interface LoginResponse {
  id: number;
  fullName: string;
  email: string;
  role: RoleSummary | null;
  permissions: Permissions;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface FormTypeRequest {
  name: string;
  witnessNumber: number;
  parentId?: number | null;
}

export interface FormTypeResponse {
  id: number;
  name: string;
  witnessNumber: number;
  parentId?: number;                 // غائب في الجذور
  childrenCount?: number;            // > 0 يعني نوعاً رئيسياً لا يُنشأ عليه ضبط
  children?: FormTypeResponse[];     // موجود فقط في /form-types/tree
}

export interface CrimeTypeRequest {
  name: string;
}

export interface CrimeTypeResponse {
  id: number;
  name: string;
}

export interface ReportTemplateRequest {
  creator?: string;      // المنشئ
  writer?: string;       // المحرر
  copyLabel?: string;    // النسخة الثانية / الثالثة
  introduction?: string;
  body?: string;         // ترميز القسم 7.6: "# عنوان"، "@دور\tدور"، "> سطر"، "**غامق**"
  referral?: string;
  conclusion?: string;
  summary?: string;
}

export interface ReportTemplateResponse extends ReportTemplateRequest {
  id: number;
  formTypeId: number;
  formTypeName: string;
}

/** نوع الضبط */
export type ReportType = 'JUDICIAL' | 'ADMINISTRATIVE' | 'RESISTANCE' | 'CRIMINAL' | 'DETENTION_RELEASE';
/** إذاعة البحث */
export type SearchBroadcast = 'PRESENT' | 'ABSENT';
/** النتيجة؛ CLOSED تجعل الضبط للقراءة فقط */
export type ReportResult = 'CLOSED' | 'UNDER_INVESTIGATION' | 'FURTHER_INVESTIGATION';

export interface EnumOption<T extends string> {
  value: T;
  label: string;         // التسمية العربية
}

export interface ReportOptionsResponse {
  types: EnumOption<ReportType>[];
  searchBroadcasts: EnumOption<SearchBroadcast>[];
  results: EnumOption<ReportResult>[];
}

/** المدعي / المدعى عليه */
export interface Party {
  name?: string | null;        // الاسم
  motherName?: string | null;  // اسم الأم
  nationalId?: string | null;  // الرقم الوطني
  origin?: string | null;      // البلد الأصلي
  residence?: string | null;   // مكان الإقامة
}

/** المصادرات: للحفظ والعرض فقط */
export interface Confiscation {
  weapons?: string | null;     // مصادرات السلاح
  vehicles?: string | null;    // مصادرات الآليات
  drugs?: string | null;       // مصادرات المخدرات
  money?: string | null;       // مصادرات المال
  seizedItems?: string | null; // المحجوزات
  notes?: string | null;       // الملاحظات
}

export interface ReportRequest {
  reportNumber: string;
  type: ReportType;
  formTypeId: number;
  reportDate: string;               // 'YYYY-MM-DD'، مطلوب
  crimeTypeId?: number | null;      // وجوده يجعل crimePlace وcrimeDate مطلوبين
  searchBroadcast?: SearchBroadcast | null;
  prosecutionPermission?: boolean;  // إذن النيابة، الافتراضي false
  discovered?: boolean;             // مكتشف، الافتراضي false
  result: ReportResult;             // مطلوب
  plaintiff?: Party | null;
  defendant?: Party | null;
  crimePlace?: string | null;       // مطلوب وغير فارغ مع crimeTypeId
  crimeDate?: string | null;        // 'YYYY-MM-DD'، مطلوب مع crimeTypeId
  actionTaken?: string | null;
  confiscation?: Confiscation | null;
  introduction?: string;
  body?: string;
  referral?: string;
  conclusion?: string;
  summary?: string;
}

export interface ReportResponse {
  id: number;
  reportNumber: string;
  reportDate: string;
  type: ReportType | null;          // null فقط في ضبوط أُنشئت قبل إضافة الحقل
  searchBroadcast: SearchBroadcast | null;
  prosecutionPermission: boolean;
  discovered: boolean;
  result: ReportResult | null;      // null فقط في ضبوط أُنشئت قبل إضافة الحقل
  plaintiff: Required<Party> | null;
  defendant: Required<Party> | null;
  crimeType: CrimeTypeResponse | null;
  crimePlace: string | null;
  crimeDate: string | null;
  actionTaken: string | null;
  confiscation: Required<Confiscation> | null;
  introduction: string | null;
  body: string | null;
  referral: string | null;
  conclusion: string | null;
  summary: string | null;
  formType: FormTypeResponse;
  creator: UserResponse;
  editor: UserResponse | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // الصفحة الحالية (من 0)
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}

/** خانة في تقسيم إحصائي؛ key = null تعني «بدون جرم» في byCrimeType و«غير محدد» في غيره */
export interface StatisticItem<K> {
  key: K | null;
  label: string;
  count: number;
  details?: StatisticDetails;               // في المستوى الأول فقط
}

/** ضبوط خانة واحدة بالتقسيمات الأخرى؛ تقسيم الخانة نفسها غائب */
export interface StatisticDetails {
  byType?: StatisticItem<ReportType>[];
  byFormType?: StatisticItem<number>[];
  byCrimeType?: StatisticItem<number>[];
  byDiscovered?: StatisticItem<boolean>[];
  byResult?: StatisticItem<ReportResult>[];
}

export interface ReportStatisticsResponse {
  from: string | null;
  to: string | null;
  total: number;
  byType: StatisticItem<ReportType>[];
  byFormType: StatisticItem<number>[];      // key = formTypeId
  byCrimeType: StatisticItem<number>[];     // key = crimeTypeId؛ غير الصفرية فقط، ثم «بدون جرم» (key null)
  byDiscovered: StatisticItem<boolean>[];
  byResult: StatisticItem<ReportResult>[];
}

export interface ReportFilters {
  page?: number;
  size?: number;
  sort?: string;       // 'reportDate,desc'
  formTypeId?: number;
  type?: ReportType;
  crimeTypeId?: number;
  result?: ReportResult;
  creatorId?: number;
  from?: string;       // 'YYYY-MM-DD'
  to?: string;
}
```

---

## 9. إعداد Axios مع تجديد التوكن تلقائياً

```ts
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, RefreshTokenResponse } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const storage = {
  get: () => ({
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
  }),
  set: (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },
};

api.interceptors.request.use((config) => {
  const { token } = storage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = storage.get();
  if (!refreshToken) throw new Error('no refresh token');
  // نستخدم axios الخام حتى لا يمر الطلب عبر الـ interceptor نفسه
  const { data } = await axios.post<RefreshTokenResponse>(
    `${BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
  );
  storage.set(data.token, data.refreshToken);
  return data.token;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;
    // الدخول والتجديد فقط؛ /auth/register يحمل توكن المدير ويستحق التجديد مثل أي طلب آخر
    const isAuthCall = original?.url === '/auth/login' || original?.url === '/auth/refresh';

    if (status === 401 && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => (refreshing = null));
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        storage.clear();
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export { storage as tokenStorage };
```

```ts
// src/api/auth.ts
import { api, tokenStorage } from './client';
import type { LoginResponse, RegisterRequest, UserResponse } from './types';

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  tokenStorage.set(data.token, data.refreshToken);
  return data;
}

// يحتاج مستخدماً مسجّلاً يملك USERS:CREATE؛ لإنشاء حساب بدور محدد استخدم POST /users
export async function register(body: RegisterRequest) {
  const { data } = await api.post<UserResponse>('/auth/register', body);
  return data;
}

export function logout() {
  tokenStorage.clear(); // لا يوجد endpoint للخروج؛ التوكن stateless
}
```

```ts
// src/api/reports.ts
import { api } from './client';
import type {
  Page, ReportFilters, ReportOptionsResponse, ReportRequest, ReportResponse, ReportResult, ReportStatisticsResponse,
} from './types';

export const reportsApi = {
  list: (filters: ReportFilters = {}) =>
    api.get<Page<ReportResponse>>('/reports', { params: filters }).then((r) => r.data),
  options: () => api.get<ReportOptionsResponse>('/reports/options').then((r) => r.data),
  exportExcel: (filters: Omit<ReportFilters, 'page' | 'size' | 'sort'> = {}) =>
    api.get<Blob>('/reports/export', { params: filters, responseType: 'blob' }).then((r) => r.data),
  statistics: (range: { from?: string; to?: string } = {}) =>
    api.get<ReportStatisticsResponse>('/reports/statistics', { params: range }).then((r) => r.data),
  get: (id: number) => api.get<ReportResponse>(`/reports/${id}`).then((r) => r.data),
  create: (body: ReportRequest) => api.post<ReportResponse>('/reports', body).then((r) => r.data),
  update: (id: number, body: ReportRequest) =>
    api.put<ReportResponse>(`/reports/${id}`, body).then((r) => r.data),
  changeResult: (id: number, result: ReportResult) =>
    api.patch<ReportResponse>(`/reports/${id}/result`, { result }).then((r) => r.data),
  remove: (id: number) => api.delete<void>(`/reports/${id}`),
  pdf: (id: number, copy?: number) =>
    api.get<Blob>(`/reports/${id}/pdf`, { params: copy ? { copy } : {}, responseType: 'blob' }).then((r) => r.data),
};

// فتح الـ PDF في تبويب جديد أو تنزيله
export async function openReportPdf(id: number, copy?: number) {
  const blob = await reportsApi.pdf(id, copy);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');                // للمعاينة والطباعة
  // أو للتنزيل:
  // const a = document.createElement('a'); a.href = url; a.download = `report-${id}.pdf`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

```ts
// src/api/formTypes.ts
import { api } from './client';
import type { ReportTemplateRequest, ReportTemplateResponse, FormTypeRequest, FormTypeResponse } from './types';

export const formTypesApi = {
  list: () => api.get<FormTypeResponse[]>('/form-types').then((r) => r.data),
  roots: () => api.get<FormTypeResponse[]>('/form-types/roots').then((r) => r.data),
  tree: () => api.get<FormTypeResponse[]>('/form-types/tree').then((r) => r.data),
  children: (id: number) =>
    api.get<FormTypeResponse[]>(`/form-types/${id}/children`).then((r) => r.data),
  create: (body: FormTypeRequest) =>
    api.post<FormTypeResponse>('/form-types', body).then((r) => r.data),
  update: (id: number, body: FormTypeRequest) =>
    api.put<FormTypeResponse>(`/form-types/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete<void>(`/form-types/${id}`),
  template: (id: number) =>
    api.get<ReportTemplateResponse>(`/form-types/${id}/template`).then((r) => r.data),
  saveTemplate: (id: number, body: ReportTemplateRequest) =>
    api.put<ReportTemplateResponse>(`/form-types/${id}/template`, body).then((r) => r.data),
  templatePdf: (id: number) =>
    api.get<Blob>(`/form-types/${id}/template/pdf`, { responseType: 'blob' }).then((r) => r.data),
};
```

```ts
// src/api/crimeTypes.ts
import { api } from './client';
import type { CrimeTypeRequest, CrimeTypeResponse } from './types';

export const crimeTypesApi = {
  list: () => api.get<CrimeTypeResponse[]>('/crime-types').then((r) => r.data),
  get: (id: number) => api.get<CrimeTypeResponse>(`/crime-types/${id}`).then((r) => r.data),
  create: (body: CrimeTypeRequest) =>
    api.post<CrimeTypeResponse>('/crime-types', body).then((r) => r.data),
  update: (id: number, body: CrimeTypeRequest) =>
    api.put<CrimeTypeResponse>(`/crime-types/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete<void>(`/crime-types/${id}`),
};
```

```ts
// src/api/users.ts
import { api } from './client';
import type { ReportInfo, UserResponse } from './types';

export const usersApi = {
  me: () => api.get<UserResponse>('/users/me').then((r) => r.data),
  list: () => api.get<UserResponse[]>('/users').then((r) => r.data),
  get: (id: number) => api.get<UserResponse>(`/users/${id}`).then((r) => r.data),
  setMyReportInfo: (body: ReportInfo) =>
    api.put<UserResponse>('/users/me/report-info', body).then((r) => r.data),
  setReportInfo: (id: number, body: ReportInfo) =>
    api.put<UserResponse>(`/users/${id}/report-info`, body).then((r) => r.data),
  remove: (id: number) => api.delete<void>(`/users/${id}`),
};
```

### عرض أخطاء التحقق في النموذج

```ts
import { AxiosError } from 'axios';
import type { ApiError } from './types';

export function extractFieldErrors(err: unknown): Record<string, string> {
  const e = err as AxiosError<ApiError>;
  return e.response?.data?.fieldErrors ?? {};
}
// مثال: fieldErrors['reportNumber'] أو fieldErrors['reportInfo.district']
```

---

## 10. أمثلة curl سريعة للتجربة

```bash
# دخول
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"12345678"}'
```

```bash
# إنشاء تقرير (استبدل TOKEN)
curl -s -X POST http://localhost:8080/api/v1/reports \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"reportNumber":"R-001","type":"CRIMINAL","formTypeId":6,"reportDate":"2026-09-15","result":"UNDER_INVESTIGATION","crimeTypeId":21,"crimePlace":"سوق الحميدية","crimeDate":"2026-09-14","discovered":true,"confiscation":{"weapons":"مسدس"},"body":"نص التقرير"}'
```

```bash
# إنشاء ضبط مملوء تلقائياً من نموذج النوع (لا ترسل أي حقل نصي)
curl -s -X POST http://localhost:8080/api/v1/reports \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"reportNumber":"2026/114","reportDate":"2026-09-15","type":"ADMINISTRATIVE","formTypeId":6,"result":"UNDER_INVESTIGATION"}'
```

```bash
# تنزيل ضبط محفوظ كورقة ضبط (النسخة الثانية)
curl -s "http://localhost:8080/api/v1/reports/1/pdf?copy=2" \
  -H "Authorization: Bearer TOKEN" -o report-1.pdf
```

```bash
# تنزيل النموذج فارغاً كورقة ضبط
curl -s http://localhost:8080/api/v1/form-types/6/template/pdf \
  -H "Authorization: Bearer TOKEN" -o template-6.pdf
```

```bash
# قائمة مُرقّمة مع فلاتر
curl -s "http://localhost:8080/api/v1/reports?type=CRIMINAL&result=UNDER_INVESTIGATION&page=0&size=10&sort=reportDate,desc" \
  -H "Authorization: Bearer TOKEN"
```

```bash
# إنشاء دور للاستعراض فقط، ثم نقل المستخدم 5 إليه (استبدل 3 بـ id الدور الناتج)
curl -s -X POST http://localhost:8080/api/v1/roles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"name":"قارئ","permissions":{"REPORTS":["VIEW"],"FORM_TYPES":["VIEW"],"CRIME_TYPES":["VIEW"]}}'

curl -s -X PUT http://localhost:8080/api/v1/users/5/role \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId":3}'
```

---

## 11. قائمة تحقق قبل البدء

- [ ] التأكد أن origin الواجهة ضمن `app.cors.allowed-origins` (الافتراضي يشمل المنافذ 3000 و5173).
- [ ] تخزين `token` و`refreshToken` بعد الدخول، وإرسال `Authorization: Bearer` مع كل طلب محمي.
- [ ] معالجة `401` بالتجديد ثم إعادة المحاولة مرة واحدة، و`403` بإظهار رسالة "غير مصرّح".
- [ ] `401` برسالة `User is disabled` يعني أن الحساب عُطّل: التجديد سيفشل أيضاً، فأخرج المستخدم إلى صفحة الدخول.
- [ ] لا توجد صفحة تسجيل عامة: `/auth/register` صار للمدير (`USERS:CREATE`)، فاحذف رابط «إنشاء حساب» من صفحة الدخول.
- [ ] إظهار الشاشات والأزرار حسب `permissions` (من الدخول أو `GET /users/me`) وفق جدول القسم 4.1، مع بقاء معالجة `403` لأن الصلاحيات قد تتغير أثناء الجلسة.
- [ ] في محرر الأدوار: عرض `description` بجانب كل خانة، وتفعيل `requires` معها (القسم 4.5).
- [ ] `role` صار كائناً `{ id, name, builtIn }` بدل `'ADMIN' | 'USER'`: استبدل أي مقارنة `role === 'ADMIN'` بفحص الصلاحية المطلوبة.
- [ ] عرض `fieldErrors` تحت الحقول المناسبة في النماذج.
- [ ] الترقيم يبدأ من الصفحة `0`.
- [ ] إرسال التواريخ بصيغة `YYYY-MM-DD` فقط.
- [ ] في `PUT` أرسل الكائن كاملاً، لأن الحقول الغائبة تُصفَّر (في الأنواع مثلاً، غياب `parentId` يحوّل النوع إلى جذر).
- [ ] معلومات الموقع (محافظة، منطقة، ناحية، قسم، مخفر) تُعيَّن على المستخدم، لا على التقرير.
- [ ] `formTypeId` يشير دائماً إلى نوع فرعي (`childrenCount` يساوي `0`)؛ الأنواع الرئيسية تصنيفات فقط.
- [ ] `reportNumber` و`reportDate` و`type` و`formTypeId` و`result` مطلوبة في كل `POST`/`PUT`، ومعها `crimePlace` و`crimeDate` متى اختير نوع جرم، وتسميات القيم الثابتة تُجلب من `GET /reports/options`.
- [ ] الضبط الذي نتيجته `CLOSED` (تم ختم الضبط) للقراءة فقط: أخفِ أزرار التعديل والحذف، وعالج `409` إن وصلت.
- [ ] ملفات الـ PDF تُجلب كـ `blob` مع ترويسة `Authorization`، لا عبر رابط مباشر.
