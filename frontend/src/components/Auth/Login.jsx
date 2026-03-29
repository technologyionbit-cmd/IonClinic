import axios from "axios";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import logo from "/Appointment Logo.webp";
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Login() {
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('session_expired') === '1') {
      setSessionExpired(true);
    }
  }, []);

  const ValidationSchema = Yup.object().shape({
    username: Yup.string().required("يجب ادخال الاسم"),
    password: Yup.string().required("يجب ادخال الباسورد"),
  });

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: ValidationSchema,
    onSubmit: async (values) => {
      try {
        const { data } = await axios.post(
          `${API_BASE}/api/auth/login`,
          { username: values.username, password: values.password },
          { headers: { "Content-Type": "application/json" } }
        );
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("session_expired");
        navigate("/");
      } catch (error) {
        formik.setStatus("اسم المستخدم أو كلمة المرور غير صحيحة");
        console.log(error);
      }
    },
  });

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white flex items-center justify-center font-[Tajawal,Cairo,sans-serif] relative overflow-hidden"
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(10,65,116,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(10,65,116,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-[420px] mx-4 bg-[#000340] rounded-2xl p-10 shadow-[0_24px_60px_rgba(0,3,64,0.25)]">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[18px] bg-white flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.2)]">
            <img src={logo} alt="logo" className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }} />
          </div>
          <h1 className="text-white text-[22px] font-bold m-0">إدارة عيادة طبية</h1>
          <p className="text-white/60 text-xs mt-1">Medical Clinic Management</p>
        </div>

        <div className="border-b border-white/10 mb-7" />

        <h2 className="text-white text-[17px] font-semibold mb-6 text-center">تسجيل الدخول</h2>

        {sessionExpired && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
            ⏱ انتهت جلستك، يرجى تسجيل الدخول مجدداً
          </div>
        )}

        {formik.status && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {formik.status}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/80 text-[13px] block mb-1.5">اسم المستخدم</label>
            <input
              type="text"
              name="username"
              placeholder="ادخل اسم المستخدم"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3.5 py-[11px] rounded-xl bg-white text-[#000340] text-sm placeholder:text-gray-400 outline-none border transition-colors box-border font-[Tajawal,Cairo,sans-serif]
    ${formik.errors.username && formik.touched.username ? "border-red-400" : "border-white focus:border-gray-300"}`}
            />
            {formik.errors.username && formik.touched.username && (
              <p className="text-red-400 text-xs mt-1">{formik.errors.username}</p>
            )}
          </div>

          <div>
            <label className="text-white/80 text-[13px] block mb-1.5">كلمة المرور</label>
            <input
              type="password"
              name="password"
              placeholder="ادخل كلمة المرور"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3.5 py-[11px] rounded-xl bg-white text-[#000340] text-sm placeholder:text-gray-400 outline-none border transition-colors box-border font-[Tajawal,Cairo,sans-serif]
    ${formik.errors.password && formik.touched.password ? "border-red-400" : "border-white focus:border-gray-300"}`}
            />
            {formik.errors.password && formik.touched.password && (
              <p className="text-red-400 text-xs mt-1">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className={`mt-2 w-full py-2.5 rounded-xl border-none text-[#000340] text-[15px] font-bold font-[Tajawal,Cairo,sans-serif] transition-all
    ${formik.isSubmitting ? "bg-white/40 cursor-not-allowed" : "bg-white cursor-pointer hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.25)]"}`}
          >
            {formik.isSubmitting ? "..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}