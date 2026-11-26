"use client";

import { useTransition } from "react";
import { CheckCircle2, CircleSlash, Trash2, UserPlus, Users } from "lucide-react";
import type { AdminUser } from "@/lib/data/admin";
import { addUser, deleteUser, updateUser, type ActionResult } from "@/actions/admin";
import { Card, Empty } from "@/components/admin/layout-bits";
import { Button, Field, inputClass, useFeedback } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils/text";

export function UserManager({ users, myEmail }: { users: AdminUser[]; myEmail: string }) {
  const { toast, confirm } = useFeedback();
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) { toast("success", res.message ?? "สำเร็จ"); after?.(); }
      else toast("error", "ข้อผิดพลาด", res.message);
    });

  return (
    <div className="space-y-6">
      <Card title="เพิ่มผู้ใช้งานใหม่">
        <form
          className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            act(() => addUser(String(fd.get("email")), String(fd.get("name") ?? ""), String(fd.get("role"))), () => form.reset());
          }}
        >
          <Field label="อีเมล CMU Account"><input type="email" name="email" required placeholder="example@cmu.ac.th" className={inputClass} /></Field>
          <Field label="ชื่อ-นามสกุล"><input name="name" placeholder="ชื่อ นามสกุล" className={inputClass} /></Field>
          <Field label="บทบาท">
            <select name="role" className={inputClass}><option value="user">User</option><option value="admin">Admin</option></select>
          </Field>
          <Button type="submit" disabled={pending}><UserPlus className="size-4" aria-hidden /> เพิ่มผู้ใช้</Button>
        </form>
      </Card>

      <Card title={`รายชื่อผู้ใช้งาน (${users.length} คน)`}>
        {users.length === 0 ? (
          <Empty title="ยังไม่มีผู้ใช้งาน" desc="เพิ่มผู้ใช้งานใหม่โดยกรอกฟอร์มด้านบน" icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-stone-500">
                <tr>
                  <th className="px-3 py-2">อีเมล</th><th className="px-3 py-2">ชื่อ</th><th className="px-3 py-2">บทบาท</th>
                  <th className="px-3 py-2">สถานะ</th><th className="px-3 py-2">วันที่เพิ่ม</th><th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => {
                  const self = u.email.toLowerCase() === myEmail.toLowerCase();
                  return (
                    <tr key={u.id}>
                      <td className="px-3 py-2 font-medium">{u.email}{self && <span className="ml-2 text-xs text-stone-400">(คุณ)</span>}</td>
                      <td className="px-3 py-2">{u.name || "-"}</td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`บทบาทของ ${u.email}`}
                          value={u.role}
                          disabled={pending || self}
                          onChange={(e) => act(() => updateUser(u.id, { role: e.target.value }))}
                          className={`${inputClass} w-auto py-1`}
                        >
                          <option value="user">User</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          disabled={pending || self}
                          onClick={() => act(() => updateUser(u.id, { toggleStatus: true }))}
                          title={self ? undefined : "คลิกเพื่อสลับสถานะ"}
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${u.status ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"}`}
                        >
                          {u.status ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleSlash className="size-3.5" aria-hidden />}
                          {u.status ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(u.createdAt)}</td>
                      <td className="px-3 py-2 text-right">
                        {!self && (
                          <button
                            disabled={pending}
                            onClick={async () => {
                              if (await confirm({ title: "ยืนยันการลบผู้ใช้นี้?", message: u.email, confirmLabel: "ลบ", danger: true }))
                                act(() => deleteUser(u.id));
                            }}
                            title="ลบ"
                            aria-label={`ลบ ${u.email}`}
                            className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
