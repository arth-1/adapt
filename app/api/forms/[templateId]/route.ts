import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params;

    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server not ready' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('form_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!error && data) {
      return NextResponse.json(data);
    }

    // Fallback built-in templates for demo IDs
  type Label = { en: string; hi: string; [key: string]: string };
  type Field = { name: string; type: 'text' | 'number' | 'date' | 'select' | 'textarea'; label: Label; required: boolean; options?: string[] };
  type Template = { id: string; name: string; fields: Field[] };

  const fallbackTemplates: Record<string, Template> = {
      'bank_kcc': {
        id: 'bank_kcc',
        name: 'Kisan Credit Card Application',
        fields: [
          { name: 'full_name', type: 'text', label: { en: 'Full Name', hi: 'पूरा नाम' }, required: true },
          { name: 'aadhaar', type: 'text', label: { en: 'Aadhaar Number', hi: 'आधार नंबर' }, required: true },
          { name: 'mobile', type: 'text', label: { en: 'Mobile Number', hi: 'मोबाइल नंबर' }, required: true },
          { name: 'address', type: 'textarea', label: { en: 'Address', hi: 'पता' }, required: true },
          { name: 'land_size', type: 'text', label: { en: 'Land Size (acres)', hi: 'ज़मीन का आकार (एकड़)' }, required: false },
        ],
      },
      'bank_loan': {
        id: 'bank_loan',
        name: 'Small Business Loan Form',
        fields: [
          { name: 'owner_name', type: 'text', label: { en: 'Owner Name', hi: 'मालिक का नाम' }, required: true },
          { name: 'business_name', type: 'text', label: { en: 'Business Name', hi: 'व्यवसाय का नाम' }, required: true },
          { name: 'loan_amount', type: 'number', label: { en: 'Loan Amount', hi: 'ऋण राशि' }, required: true },
          { name: 'purpose', type: 'textarea', label: { en: 'Purpose', hi: 'उद्देश्य' }, required: false },
        ],
      },
      'kyc_update': {
        id: 'kyc_update',
        name: 'KYC Update Form',
        fields: [
          { name: 'full_name', type: 'text', label: { en: 'Full Name', hi: 'पूरा नाम' }, required: true },
          { name: 'dob', type: 'date', label: { en: 'Date of Birth', hi: 'जन्म तिथि' }, required: true },
          { name: 'aadhaar', type: 'text', label: { en: 'Aadhaar Number', hi: 'आधार नंबर' }, required: true },
          { name: 'address', type: 'textarea', label: { en: 'New Address', hi: 'नया पता' }, required: false },
        ],
      },
      'gov_ssy': {
        id: 'gov_ssy',
        name: 'Sukanya Samriddhi Yojana',
        fields: [
          { name: 'guardian_name', type: 'text', label: { en: 'Guardian Name', hi: 'अभिभावक का नाम' }, required: true },
          { name: 'girl_name', type: 'text', label: { en: 'Girl Child Name', hi: 'बालिका का नाम' }, required: true },
          { name: 'dob', type: 'date', label: { en: 'Date of Birth', hi: 'जन्म तिथि' }, required: true },
          { name: 'aadhaar', type: 'text', label: { en: 'Aadhaar Number', hi: 'आधार नंबर' }, required: true },
        ],
      },
      'gov_bbbp': {
        id: 'gov_bbbp',
        name: 'Beti Bachao Beti Padhao',
        fields: [
          { name: 'applicant_name', type: 'text', label: { en: 'Applicant Name', hi: 'आवेदक का नाम' }, required: true },
          { name: 'district', type: 'text', label: { en: 'District', hi: 'जिला' }, required: true },
          { name: 'mobile', type: 'text', label: { en: 'Mobile Number', hi: 'मोबाइल नंबर' }, required: true },
        ],
      },
    };

    const fallback = fallbackTemplates[templateId];
    if (fallback) {
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Form template fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
