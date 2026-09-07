export const DocumentStatus = ['ready', 'review', 'processing']
export const DocumentType = ['Invoice', 'Receipt']
export const NavId = ['documents', 'search', 'review-queue']

export const ExtractedField = {
  id: '',
  label: '',
  value: '',
  confidence: 0,
  message: ''
}

export const InvoiceLine = {
  description: '',
  qty: 0,
  amount: ''
}

export const InvoicePreview = {
  brand: '',
  brandSubtitle: '',
  invoiceNumber: '',
  billTo: [],
  invoiceDate: '',
  dueDate: '',
  lines: [],
  total: ''
}

export const DocRecord = {
  id: '',
  name: '',
  size: '',
  type: DocumentType[0],
  status: DocumentStatus[0],
  fieldsLabel: '',
  uploaded: '',
  uploadedDetail: '',
  preview: InvoicePreview,
  extracted: []
}