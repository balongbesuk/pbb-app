import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { joinServerUrl } from '../utils/server';
import { generateMutationDocxMobile } from '../utils/mutation-docx-gen';
import type { ScreenProps } from '../types/navigation';
import { appTheme } from '../theme/app-theme';
import { ScalableButton } from '../components/ScalableButton';

interface SpptData { nop: string; namaWp: string; alamat: string; luasTanah: number; luasBangunan: number; }
type MutationReason = "JUAL_BELI" | "HIBAH" | "WARIS";

export default function MutationScreen({ route, navigation }: ScreenProps<'Mutation'>) {
  const { serverUrl, isDark, initialDraft } = route.params;
  const [step, setStep] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [nomorSurat, setNomorSurat] = useState(""); const [namaKades, setNamaKades] = useState(""); const [dasar, setDasar] = useState<MutationReason>("JUAL_BELI");
  const [pemohon, setPemohon] = useState(""); const [nikPemohon, setNikPemohon] = useState(""); const [telpPemohon, setTelpPemohon] = useState("");
  const [oldNop, setOldNop] = useState(""); const [oldData, setOldData] = useState<SpptData | null>(null);
  const [newDataList, setNewDataList] = useState<SpptData[]>([]); const [luasSebenarnya, setLuasSebenarnya] = useState(""); const [sisa, setSisa] = useState("HABIS");
  const [villageMetadata, setVillageMetadata] = useState({ villageName: "BALONGBESUK", districtName: "DIWEK", regencyName: "JOMBANG", address: "", email: "", zip: "", logoUrl: null as string | null });
  const [drafts, setDrafts] = useState<any[]>([]);

  const fetchVillageConfig = async () => { try { const r = await fetch(joinServerUrl(serverUrl, '/api/village-config')); const d = await r.json(); if (d) { setVillageMetadata({ villageName: d.namaDesa || "BALONGBESUK", districtName: d.kecamatan || "DIWEK", regencyName: d.kabupaten || "JOMBANG", address: d.alamatKantor || "", email: d.email || "", zip: d.kodePos || "", logoUrl: d.logoUrl ? joinServerUrl(serverUrl, d.logoUrl) : null }); if (d.namaKades) setNamaKades(d.namaKades); } } catch (e) {} };
  const loadDrafts = async () => { try { const s = await AsyncStorage.getItem('@mutation_drafts_v1'); setDrafts(s ? JSON.parse(s) : []); } catch (e) { setDrafts([]); } };

  useEffect(() => { loadDrafts(); if (serverUrl) fetchVillageConfig(); }, [serverUrl]);
  useEffect(() => { if (initialDraft) { if (initialDraft.nopLama) setOldNop(initialDraft.nopLama); if (initialDraft.namaPemohon) setPemohon(initialDraft.namaPemohon); if (initialDraft.alasan?.includes('JUAL')) setDasar('JUAL_BELI'); } }, [initialDraft]);

  const handleNopChange = (text: string) => { if (/[a-zA-Z]/.test(text)) { setOldNop(text); return; } const c = text.replace(/[^0-9]/g, ''); let f = ''; for (let i = 0; i < c.length; i++) { if (i === 2 || i === 4 || i === 7 || i === 10) f += '.'; else if (i === 13) f += '-'; else if (i === 17) f += '.'; f += c[i]; } setOldNop(f.substring(0, 24)); };

  const handleNopSearch = async () => {
    const cn = oldNop.replace(/[^0-9]/g, ''); if (!oldNop || cn.length < 18) { Alert.alert("Perhatian", "Masukkan 18 digit NOP."); return; }
    setLoadingSearch(true);
    try { const r = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(oldNop.trim())}`); const d = await r.json();
      if (d.success && d.data?.length > 0) { const l = d.data[0]; const m: SpptData = { nop: l.nop, namaWp: l.namaWp, alamat: l.alamatObjek, luasTanah: l.luasTanah || 0, luasBangunan: l.luasBangunan || 0 }; setOldData(m); setNewDataList([{ ...m, namaWp: "", alamat: "" }]); }
      else { Alert.alert("Tidak Ditemukan", "NOP tidak terdaftar."); setOldData({ nop: oldNop, namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 }); setNewDataList([{ nop: "", namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 }]); }
    } catch (e) { Alert.alert("Error", "Gagal menghubungi server."); } finally { setLoadingSearch(false); }
  };

  const totalLuasTanahBaru = useMemo(() => newDataList.reduce((a, c) => a + Number(c.luasTanah || 0), 0), [newDataList]);
  useEffect(() => { if (oldData) { const s = oldData.luasTanah - totalLuasTanahBaru; setLuasSebenarnya(Math.max(s, 0).toString()); setSisa(s > 0 ? "MASIH SISA" : "HABIS"); } }, [totalLuasTanahBaru, oldData]);

  const handleAddField = () => setNewDataList([...newDataList, { nop: "", namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 }]);
  const handleRemoveField = (i: number) => { if (newDataList.length > 1) setNewDataList(newDataList.filter((_, idx) => idx !== i)); };
  const handleTelpChange = (t: string) => setTelpPemohon(t.replace(/[^0-9]/g, '').substring(0, 15));
  const updateNewData = (i: number, f: keyof SpptData, v: any) => { const n = [...newDataList]; n[i] = { ...n[i], [f]: v }; setNewDataList(n); };

  const validateStep1 = () => { if (!nomorSurat) return Alert.alert("", "Nomor Surat wajib diisi."); if (!pemohon) return Alert.alert("", "Nama Pemohon wajib diisi."); if (nikPemohon.length !== 16) return Alert.alert("", "NIK harus 16 digit."); if (telpPemohon.length < 10) return Alert.alert("", "Telp minimal 10 digit."); if (!oldData) return Alert.alert("", "Cari data NOP terlebih dahulu."); setStep(2); };
  const validateStep2 = () => { for (const i of newDataList) { if (!i.namaWp) return Alert.alert("", "Nama WP baru wajib diisi."); if (i.luasTanah <= 0) return Alert.alert("", "Luas tanah harus > 0."); } setStep(3); };

  const handleSaveDraft = async () => {
    const p = { id: `MUT-${Date.now()}`, createdAt: new Date().toISOString(), serverUrl, formData: { dasar, pemohon, nikPemohon, telpPemohon, nomorSurat, namaKades, oldData, newDataList, luasSebenarnya, sisa } };
    try { const s = await AsyncStorage.getItem('@mutation_drafts_v1'); const e = s ? JSON.parse(s) : []; await AsyncStorage.setItem('@mutation_drafts_v1', JSON.stringify([p, ...e].slice(0, 20))); Alert.alert("Tersimpan", "Draft mutasi disimpan."); navigation.goBack(); } catch (e) { Alert.alert("Error", "Gagal menyimpan."); }
  };

  const handlePrintPdf = async () => {
    setIsExporting(true);
    try {
      const dt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
      const html = `<html><head><style>body{font-family:"Times New Roman",serif;padding:40px;line-height:1.4;font-size:12pt}.header{display:flex;justify-content:space-between;margin-bottom:30px}.kop{text-align:center;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:20px}.font-bold{font-weight:bold}.underline{text-decoration:underline}.uppercase{text-transform:uppercase}.indent{text-indent:40px}table{width:100%;border-collapse:collapse;margin:10px 0}td{vertical-align:top;padding:2px 0}.signature{margin-top:50px;text-align:right;margin-right:40px}.sign-space{height:80px}</style></head><body>
        <div class="header"><div style="width:50%"><p>Perihal : Perubahan Mutasi/Pemecahan</p><p style="padding-left:54px">Objek/Subjek PBB Tahun ${new Date().getFullYear()}</p></div><div style="width:50%"><p>Kepada Yth.</p><p class="font-bold">Kepala Badan Pendapatan Daerah</p><p class="font-bold">Kabupaten ${villageMetadata.regencyName}</p><p>di - <span class="font-bold">${villageMetadata.regencyName}</span></p></div></div>
        <p class="indent">Sehubungan dengan terjadinya: <b>${dasar}</b> atas nama <b>${oldData?.namaWp}</b>, kami mohon perubahan data sebagai berikut:</p>
        <p class="font-bold">LAMA:</p><table><tr><td width="180">NOP</td><td>: ${oldData?.nop}</td></tr><tr><td>Nama Wajib Pajak</td><td>: ${oldData?.namaWp}</td></tr><tr><td>Luas Tanah / Bangunan</td><td>: ${oldData?.luasTanah} m² / ${oldData?.luasBangunan} m²</td></tr></table>
        <p class="font-bold">BARU:</p>${newDataList.map((i, idx) => `<div style="margin-bottom:15px"><table><tr><td width="180">${idx + 1}. Nama Wajib Pajak</td><td>: ${i.namaWp}</td></tr><tr><td>Luas Tanah / Bangunan</td><td>: ${i.luasTanah} m² / ${i.luasBangunan} m²</td></tr></table></div>`).join('')}
        <p class="font-bold">Luas sebenarnya: ${luasSebenarnya} m², Status: ${sisa}</p>
        <div class="signature"><p>${villageMetadata.villageName}, ${dt}</p><p>Hormat kami,</p><div class="sign-space"></div><p class="font-bold underline uppercase">${pemohon}</p></div>
        <div style="page-break-before:always"></div>
        <div class="kop"><p class="font-bold uppercase">PEMERINTAH KABUPATEN ${villageMetadata.regencyName}</p><p class="font-bold uppercase">KECAMATAN ${villageMetadata.districtName}</p><p class="font-bold" style="font-size:16pt">KANTOR DESA ${villageMetadata.villageName}</p><p style="font-size:10pt;font-style:italic">${villageMetadata.address} | Email: ${villageMetadata.email}</p></div>
        <div style="text-align:center;margin-bottom:20px"><p class="font-bold underline" style="font-size:18pt">SURAT KETERANGAN</p><p>Nomor : ${nomorSurat}</p></div>
        <p>Menerangkan bahwa pemohon <b>${pemohon}</b> (NIK: ${nikPemohon}) mengajukan mutasi PBB atas NOP ${oldData?.nop} menjadi data baru sebagaimana terlampir.</p>
        <div class="signature"><p>${villageMetadata.villageName}, ${dt}</p><p>Kepala Desa ${villageMetadata.villageName}</p><div class="sign-space"></div><p class="font-bold underline">${namaKades}</p></div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Gagal cetak PDF."); } finally { setIsExporting(false); }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try { await generateMutationDocxMobile({ dasar, pemohon, nikPemohon, telpPemohon, nomorSurat, namaKades, oldData: oldData!, newDataList, luasSebenarnya, sisa, villageName: villageMetadata.villageName, districtName: villageMetadata.districtName, regencyName: villageMetadata.regencyName, villageAddress: villageMetadata.address, villageEmail: villageMetadata.email, villageZip: villageMetadata.zip, villageLogo: villageMetadata.logoUrl }); }
    catch (e) { Alert.alert("Error", "Gagal membuat Word."); } finally { setIsExporting(false); }
  };

  const inputStyle = { backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 14, fontWeight: '600' as const, color: appTheme.colors.text, marginBottom: 12 };
  const cardStyle = { backgroundColor: appTheme.colors.surface, borderRadius: 26, padding: 22, marginBottom: 14, ...appTheme.shadow.card };
  const labelStyle = { color: appTheme.colors.textMuted, fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 12 };

  const renderStep1 = () => (
    <View>
      <View style={cardStyle}><Text style={labelStyle}>1. Identitas Berkas</Text>
        <TextInput style={inputStyle} placeholder="Nomor Surat Keterangan" value={nomorSurat} onChangeText={setNomorSurat} placeholderTextColor={appTheme.colors.textSoft} />
        <TextInput style={inputStyle} placeholder="Nama Kepala Desa" value={namaKades} onChangeText={setNamaKades} placeholderTextColor={appTheme.colors.textSoft} /></View>
      <View style={cardStyle}><Text style={labelStyle}>2. Detail Pemohon</Text>
        <TextInput style={inputStyle} placeholder="Nama Lengkap Pemohon" value={pemohon} onChangeText={setPemohon} placeholderTextColor={appTheme.colors.textSoft} />
        <TextInput style={inputStyle} placeholder="NIK (16 digit)" keyboardType="numeric" maxLength={16} value={nikPemohon} onChangeText={setNikPemohon} placeholderTextColor={appTheme.colors.textSoft} />
        <TextInput style={inputStyle} placeholder="No. Telp / WhatsApp" keyboardType="phone-pad" maxLength={15} value={telpPemohon} onChangeText={handleTelpChange} placeholderTextColor={appTheme.colors.textSoft} /></View>
      <View style={cardStyle}><Text style={labelStyle}>3. NOP Lama</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput style={[inputStyle, { flex: 1, marginBottom: 0, marginRight: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]} placeholder="Ketik NOP" value={oldNop} onChangeText={handleNopChange} keyboardType="numeric" placeholderTextColor={appTheme.colors.textSoft} />
          <ScalableButton onPress={handleNopSearch} disabled={loadingSearch}>
            <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              {loadingSearch ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="search" size={22} color="white" />}
            </LinearGradient>
          </ScalableButton>
        </View>
        {oldData && <View style={{ marginTop: 14, padding: 16, borderRadius: 20, backgroundColor: appTheme.colors.surfaceMuted }}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: appTheme.colors.infoSoft, marginBottom: 8 }}><Text style={{ color: appTheme.colors.info, fontSize: 9, fontWeight: '700' }}>TERDETEKSI</Text></View>
          <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '700' }}>{oldData.namaWp}</Text><Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '500', marginTop: 2 }}>{oldData.alamat}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}><View style={{ marginRight: 20 }}><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Tanah</Text><Text style={{ color: appTheme.colors.success, fontSize: 12, fontWeight: '700' }}>{oldData.luasTanah} m²</Text></View>
            <View><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Bangunan</Text><Text style={{ color: appTheme.colors.accent, fontSize: 12, fontWeight: '700' }}>{oldData.luasBangunan} m²</Text></View></View>
        </View>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View style={cardStyle}><Text style={labelStyle}>4. Dasar Mutasi</Text>
        <View style={{ flexDirection: 'row' }}>{(["JUAL_BELI", "HIBAH", "WARIS"] as MutationReason[]).map((r) => (
          <ScalableButton key={r} onPress={() => setDasar(r)} style={{ flex: 1, marginHorizontal: 3 }}>
            <View style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: dasar === r ? appTheme.colors.primary : appTheme.colors.surfaceMuted }}>
              <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: dasar === r ? 'white' : appTheme.colors.textMuted }}>{r.replace('_', ' ')}</Text>
            </View>
          </ScalableButton>
        ))}</View></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={labelStyle}>5. Objek Baru</Text>
        <ScalableButton onPress={handleAddField}><View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: appTheme.colors.successSoft }}><Text style={{ color: appTheme.colors.success, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>+ Tambah</Text></View></ScalableButton>
      </View>
      {newDataList.map((item, idx) => (
        <View key={idx} style={cardStyle}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: appTheme.colors.infoSoft }}><Text style={{ color: appTheme.colors.info, fontSize: 9, fontWeight: '700' }}>OBJEK #{idx + 1}</Text></View>
            {newDataList.length > 1 && <ScalableButton onPress={() => handleRemoveField(idx)}><Ionicons name="trash-outline" size={16} color={appTheme.colors.danger} /></ScalableButton>}
          </View>
          <TextInput style={inputStyle} placeholder="Nama WP Baru" value={item.namaWp} onChangeText={(t) => updateNewData(idx, 'namaWp', t)} placeholderTextColor={appTheme.colors.textSoft} />
          <TextInput style={inputStyle} placeholder="Alamat (kosongkan jika sama)" value={item.alamat} onChangeText={(t) => updateNewData(idx, 'alamat', t)} placeholderTextColor={appTheme.colors.textSoft} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 6 }}><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Tanah (m²)</Text><TextInput style={inputStyle} keyboardType="numeric" value={item.luasTanah.toString()} onChangeText={(t) => updateNewData(idx, 'luasTanah', Number(t))} /></View>
            <View style={{ flex: 1, marginLeft: 6 }}><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Bangunan (m²)</Text><TextInput style={inputStyle} keyboardType="numeric" value={item.luasBangunan.toString()} onChangeText={(t) => updateNewData(idx, 'luasBangunan', Number(t))} /></View>
          </View>
        </View>
      ))}
      <View style={{ backgroundColor: totalLuasTanahBaru > (oldData?.luasTanah || 0) ? appTheme.colors.dangerSoft : appTheme.colors.surface, borderRadius: 26, padding: 20, ...appTheme.shadow.soft }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Total Input</Text><Text style={{ color: totalLuasTanahBaru > (oldData?.luasTanah || 0) ? appTheme.colors.danger : appTheme.colors.text, fontSize: 24, fontWeight: '800' }}>{totalLuasTanahBaru} m²</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ color: appTheme.colors.textSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Limit: {oldData?.luasTanah || 0} m²</Text>
            <Text style={{ color: totalLuasTanahBaru > (oldData?.luasTanah || 0) ? appTheme.colors.danger : appTheme.colors.success, fontSize: 11, fontWeight: '600', marginTop: 4 }}>{totalLuasTanahBaru > (oldData?.luasTanah || 0) ? "⚠️ Melebihi" : `Sisa: ${(oldData?.luasTanah || 0) - totalLuasTanahBaru} m²`}</Text></View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View style={{ padding: 28, borderRadius: 32, alignItems: 'center', backgroundColor: appTheme.colors.successSoft, marginBottom: 20 }}>
        <LinearGradient colors={[appTheme.colors.success, '#047857']} style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...appTheme.shadow.floating }}>
          <Ionicons name="checkmark-done" size={36} color="white" />
        </LinearGradient>
        <Text style={{ color: appTheme.colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 }}>Berkas Siap!</Text>
        <Text style={{ color: appTheme.colors.textMuted, textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
          Data mutasi <Text style={{ fontWeight: '700', color: appTheme.colors.success }}>{pemohon}</Text> sudah tervalidasi dan siap dicetak.
        </Text>
      </View>
      <ScalableButton onPress={handlePrintPdf} disabled={isExporting} style={{ marginBottom: 10 }}>
        <View style={{ backgroundColor: appTheme.colors.surface, paddingVertical: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...appTheme.shadow.card }}>
          {isExporting ? <ActivityIndicator color={appTheme.colors.text} /> : <><Ionicons name="print-outline" size={20} color={appTheme.colors.text} style={{ marginRight: 8 }} /><Text style={{ color: appTheme.colors.text, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Cetak PDF</Text></>}
        </View>
      </ScalableButton>
      <ScalableButton onPress={handleExportWord} disabled={isExporting} style={{ marginBottom: 14 }}>
        <View style={{ backgroundColor: appTheme.colors.surfaceMuted, paddingVertical: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {isExporting ? <ActivityIndicator color={appTheme.colors.textMuted} /> : <><Ionicons name="document-text-outline" size={20} color={appTheme.colors.textMuted} style={{ marginRight: 8 }} /><Text style={{ color: appTheme.colors.textMuted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Unduh Word</Text></>}
        </View>
      </ScalableButton>
      <View style={{ backgroundColor: appTheme.colors.accentSoft, padding: 16, borderRadius: 18 }}>
        <Text style={{ color: appTheme.colors.accent, fontSize: 11, fontWeight: '600', lineHeight: 18, fontStyle: 'italic' }}>💡 Format DOCX sesuai standar BAPENDA. Gunakan Word untuk edit lanjutan.</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <StatusBar style="dark" />
      {/* Wizard header */}
      <View style={{ paddingHorizontal: 28, paddingTop: 58, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: appTheme.colors.border, backgroundColor: appTheme.colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <ScalableButton onPress={() => navigation.goBack()}>
            <View style={{ width: 44, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: appTheme.colors.surfaceMuted }}>
              <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
            </View>
          </ScalableButton>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: appTheme.colors.text, fontSize: 17, fontWeight: '700' }}>{step === 3 ? "Selesai" : "Mutasi PBB"}</Text>
            <Text style={{ color: appTheme.colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Step {step}/3</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ alignItems: 'center', marginHorizontal: 18 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: step >= s ? appTheme.colors.primary : 'transparent', borderColor: step >= s ? appTheme.colors.primary : appTheme.colors.textSoft }}>
                {step > s ? <Ionicons name="checkmark" size={16} color="white" /> : <Text style={{ fontWeight: '800', color: step === s ? 'white' : appTheme.colors.textSoft }}>{s}</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {step === 1 && renderStep1()}{step === 2 && renderStep2()}{step === 3 && renderStep3()}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: appTheme.colors.border, backgroundColor: appTheme.colors.surface }}>
        <View style={{ flexDirection: 'row' }}>
          {step > 1 && step < 3 && <ScalableButton onPress={() => setStep(step - 1)} style={{ flex: 1, marginRight: 10 }}>
            <View style={{ paddingVertical: 16, borderRadius: 20, alignItems: 'center', backgroundColor: appTheme.colors.surfaceMuted }}><Text style={{ fontWeight: '700', fontSize: 13, color: appTheme.colors.textMuted }}>Kembali</Text></View>
          </ScalableButton>}
          <ScalableButton onPress={step === 1 ? validateStep1 : step === 2 ? validateStep2 : handleSaveDraft} style={{ flex: 2 }}>
            <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} style={{ paddingVertical: 16, borderRadius: 20, alignItems: 'center', ...appTheme.shadow.floating }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{step === 1 ? "Lanjut ke Objek Baru" : step === 2 ? "Lihat Hasil Akhir" : "Simpan Berkas"}</Text>
            </LinearGradient>
          </ScalableButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
