import { useState } from "react";
import Layout from "../components/layout/Layout";
import { WrapText, GripVertical, Type, Mail, Phone, Calendar, Star, ChevronDown, CheckSquare, Radio, AlignLeft, Hash, Upload, Music } from "lucide-react";

const fieldTypes = [
  { type: "text", label: "Short Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "date", label: "Date", icon: Calendar },
  { type: "textarea", label: "Long Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Dropdown", icon: ChevronDown },
  { type: "checkbox", label: "Checkboxes", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: Radio },
  { type: "rating", label: "Star Rating", icon: Star },
  { type: "file", label: "File Upload", icon: Upload },
  { type: "playlist", label: "Playlist Link", icon: Music },
];

const defaultFields = [
  { id: "f1", type: "text", label: "Full Name", required: true },
  { id: "f2", type: "email", label: "Email Address", required: true },
  { id: "f3", type: "phone", label: "Phone Number", required: false },
  { id: "f4", type: "date", label: "Event Date", required: true },
  { id: "f5", type: "select", label: "Event Type", required: true },
  { id: "f6", type: "playlist", label: "Music Playlist", required: false },
  { id: "f7", type: "textarea", label: "Additional Notes", required: false },
];

const forms = [
  { id: "form1", name: "General Booking Inquiry", fields: 7, submissions: 48, active: true },
  { id: "form2", name: "Wedding Music Planner", fields: 14, submissions: 22, active: true },
  { id: "form3", name: "Corporate Event Form", fields: 9, submissions: 15, active: true },
  { id: "form4", name: "Quick Quote Request", fields: 5, submissions: 31, active: false },
];

export default function Forms() {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [fields, setFields] = useState(defaultFields);
  const [editingField, setEditingField] = useState<any>(null);
  const [formName, setFormName] = useState("General Booking Inquiry");

  return (
    <Layout title="Form Builder" subtitle="Create beautiful, interactive booking forms" action={{ label: "New Form", onClick: () => setActiveForm("new") }}>
      {!activeForm ? (
        <>
          {/* Form list */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {forms.map((form) => (
              <div
                key={form.id}
                className="empire-card p-5 cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => setActiveForm(form.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 42, height: 42, background: "rgba(124,58,237,0.15)" }}
                  >
                    <WrapText size={20} color="#9D6FEF" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: form.active ? "#10B981" : "#475569" }}
                    />
                    <span className="text-xs" style={{ color: form.active ? "#10B981" : "#475569" }}>
                      {form.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{form.name}</h3>
                <p className="text-xs" style={{ color: "#475569" }}>
                  {form.fields} fields · {form.submissions} submissions
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    className="flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)", color: "white" }}
                  >
                    Edit Form
                  </button>
                  <button
                    className="flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
            <button
              className="empire-card p-5 flex flex-col items-center justify-center cursor-pointer hover:scale-[1.01] transition-all"
              style={{ border: "1px dashed #252A3A", background: "transparent" }}
              onClick={() => setActiveForm("new")}
            >
              <div
                className="flex items-center justify-center rounded-full mb-2"
                style={{ width: 48, height: 48, background: "rgba(124,58,237,0.1)" }}
              >
                <span style={{ color: "#7C3AED", fontSize: 24 }}>+</span>
              </div>
              <p className="font-medium" style={{ color: "#7C3AED" }}>Create New Form</p>
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-4">
          {/* Field palette */}
          <div className="empire-card p-4 w-56 flex-shrink-0">
            <p className="text-xs font-semibold mb-3" style={{ color: "#475569" }}>FIELD TYPES</p>
            <div className="grid grid-cols-2 gap-2">
              {fieldTypes.map((ft) => (
                <button
                  key={ft.type}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg text-xs cursor-pointer transition-all"
                  style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#252A3A")}
                  onClick={() => setFields([...fields, { id: `f${Date.now()}`, type: ft.type, label: ft.label, required: false }])}
                >
                  <ft.icon size={16} color="#9D6FEF" />
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form canvas */}
          <div className="empire-card flex-1 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="font-bold text-white text-lg bg-transparent outline-none border-b-2 px-0"
                  style={{ fontFamily: "Syne, sans-serif", borderColor: "transparent" }}
                  onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={e => (e.target.style.borderColor = "transparent")}
                />
                <p className="text-xs mt-1" style={{ color: "#475569" }}>Drag fields to reorder</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
                  onClick={() => setActiveForm(null)}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!formName.trim()) { alert("Form name required"); return; }
                    if (fields.length === 0) { alert("Add at least 1 field"); return; }
                    const missingLabels = fields.filter(f => !f.label?.trim());
                    if (missingLabels.length > 0) { 
                      alert(`${missingLabels.length} field(s) missing labels`); 
                      return; 
                    }
                    alert("Form saved! (Demo - would save to API)");
                    setActiveForm(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
                >
                  Save Form
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-4 rounded-xl cursor-move transition-all group"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                >
                  <GripVertical size={16} color="#252A3A" className="flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{field.label}</span>
                      {field.required && (
                        <span className="text-xs text-red-400">*</span>
                      )}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(124,58,237,0.1)", color: "#9D6FEF" }}
                    >
                      {field.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingField(field)}
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={{ background: "#252A3A", color: "#94A3B8" }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                      onClick={() => setFields(fields.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-3 p-4 rounded-xl text-center text-sm cursor-pointer"
              style={{ background: "transparent", border: "2px dashed #252A3A", color: "#475569" }}
            >
              + Drop a field here or click from the palette
            </div>
          </div>

          {/* Preview */}
          <div className="empire-card p-5 w-64 flex-shrink-0">
            <p className="text-xs font-semibold mb-4" style={{ color: "#475569" }}>FORM PREVIEW</p>
            <div className="space-y-3">
              {fields.slice(0, 5).map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>
                    {field.label} {field.required && <span style={{ color: "#EF4444" }}>*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea disabled placeholder="Enter text..."
                      className="w-full rounded-lg px-3 py-2 h-16 text-xs resize-none"
                      style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#475569" }} />
                  ) : field.type === "select" ? (
                    <select disabled
                      className="w-full rounded-lg px-3 py-2 text-xs"
                      style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#475569" }}>
                      <option>Select option</option>
                    </select>
                  ) : field.type === "date" ? (
                    <input type="date" disabled
                      className="w-full rounded-lg px-3 py-2 text-xs"
                      style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#475569" }} />
                  ) : field.type === "checkbox" ? (
                    <div className="flex items-center gap-2">
                      <input type="checkbox" disabled style={{ cursor: "not-allowed" }} />
                      <span className="text-xs" style={{ color: "#475569" }}>Option 1</span>
                    </div>
                  ) : field.type === "radio" ? (
                    <div className="flex items-center gap-2">
                      <input type="radio" disabled style={{ cursor: "not-allowed" }} />
                      <span className="text-xs" style={{ color: "#475569" }}>Option 1</span>
                    </div>
                  ) : (
                    <input type={field.type} disabled placeholder={field.type === "email" ? "email@example.com" : `Enter ${field.label.toLowerCase()}...`}
                      className="w-full rounded-lg px-3 py-2 text-xs"
                      style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#475569" }} />
                  )}
                </div>
              ))}
              <button
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
