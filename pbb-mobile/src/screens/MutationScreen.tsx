import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { joinServerUrl } from '../utils/server';
import { generateMutationDocxMobile } from '../utils/mutation-docx-gen';
import type { ScreenProps } from '../types/navigation';

interface SpptData {
  nop: string;
  namaWp: string;
  alamat: string;
  luasTanah: number;
  luasBangunan: number;
}

type MutationReason = "JUAL_BELI" | "HIBAH" | "WARIS";

export default function MutationScreen({ route, navigation }: ScreenProps<'Mutation'>) {
  const { serverUrl, isDark, initialDraft } = route.params;

  // --- Step & Workflow States ---
  const [step, setStep] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Identitas & Old Data ---
  const [nomorSurat, setNomorSurat] = useState("");
  const [namaKades, setNamaKades] = useState("");
  const [dasar, setDasar] = useState<MutationReason>("JUAL_BELI");
  const [pemohon, setPemohon] = useState("");
  const [nikPemohon, setNikPemohon] = useState("");
  const [telpPemohon, setTelpPemohon] = useState("");
  
  const [oldNop, setOldNop] = useState("");
  const [oldData, setOldData] = useState<SpptData | null>(null);

  // --- New Data States ---
  const [newDataList, setNewDataList] = useState<SpptData[]>([]);
  const [luasSebenarnya, setLuasSebenarnya] = useState("");
  const [sisa, setSisa] = useState("HABIS");

  // Village Metadata (Fetched from server)
  const [villageMetadata, setVillageMetadata] = useState({
    villageName: "BALONGBESUK",
    districtName: "DIWEK",
    regencyName: "JOMBANG",
    address: "",
    email: "",
    zip: "",
    logoUrl: null as string | null
  });

  const [drafts, setDrafts] = useState<any[]>([]);

  const fetchVillageConfig = async () => {
    try {
      const url = joinServerUrl(serverUrl, '/api/village-config');
      const res = await fetch(url);
      const data = await res.json();
      
      if (data) {
        setVillageMetadata({
          villageName: data.namaDesa || "BALONGBESUK",
          districtName: data.kecamatan || "DIWEK",
          regencyName: data.kabupaten || "JOMBANG",
          address: data.alamatKantor || "",
          email: data.email || "",
          zip: data.kodePos || "",
          logoUrl: data.logoUrl ? joinServerUrl(serverUrl, data.logoUrl) : null
        });
        
        // Ensure namaKades is filled
        if (data.namaKades) {
          setNamaKades(data.namaKades);
        }
      }
    } catch (err) { 
      console.warn("Failed to fetch village config", err); 
    }
  };

  const loadDrafts = async () => {
    try {
      const saved = await AsyncStorage.getItem('@mutation_drafts_v1');
      setDrafts(saved ? JSON.parse(saved) : []);
    } catch (e) { setDrafts([]); }
  };

  useEffect(() => {
    loadDrafts();
    if (serverUrl) {
      fetchVillageConfig();
    }
  }, [serverUrl]);

  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.nopLama) setOldNop(initialDraft.nopLama);
      if (initialDraft.namaPemohon) setPemohon(initialDraft.namaPemohon);
      if (initialDraft.alasan && initialDraft.alasan.includes('JUAL')) setDasar('JUAL_BELI');
    }
  }, [initialDraft]);


  const handleNopChange = (text: string) => {
    // Only format if it starts with numbers (avoids formatting names if we ever search by name here)
    if (/[a-zA-Z]/.test(text)) { setOldNop(text); return; }
    
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
        if (i === 2 || i === 4 || i === 7 || i === 10) formatted += '.';
        else if (i === 13) formatted += '-';
        else if (i === 17) formatted += '.';
        formatted += cleaned[i];
    }
    setOldNop(formatted.substring(0, 24));
  };

  const handleNopSearch = async () => {
    const cleanedNop = oldNop.replace(/[^0-9]/g, '');
    if (!oldNop || cleanedNop.length < 18) {
      Alert.alert("Perhatian", "Masukkan 18 digit NOP dengan benar.");
      return;
    }

    setLoadingSearch(true);
    try {
      // Use the raw nop from input (which is now formatted correctly)
      const res = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(oldNop.trim())}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const latest = data.data[0];
        const mapped: SpptData = {
          nop: latest.nop,
          namaWp: latest.namaWp,
          alamat: latest.alamatObjek,
          luasTanah: latest.luasTanah || 0,
          luasBangunan: latest.luasBangunan || 0,
        };
        setOldData(mapped);
        setNewDataList([{ ...mapped, namaWp: "", alamat: "" }]);
      } else {
        Alert.alert("Data Tidak Ditemukan", "NOP tidak terdaftar di database desa.");
        setOldData({ nop: oldNop, namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 });
        setNewDataList([{ nop: "", namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 }]);
      }
    } catch (err) {
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const totalLuasTanahBaru = useMemo(() => 
    newDataList.reduce((acc, curr) => acc + Number(curr.luasTanah || 0), 0)
  , [newDataList]);

  useEffect(() => {
    if (oldData) {
      const sisaVal = oldData.luasTanah - totalLuasTanahBaru;
      const finalSisa = sisaVal <= 0 ? 0 : sisaVal;
      setLuasSebenarnya(finalSisa.toString());
      setSisa(finalSisa > 0 ? "MASIH SISA" : "HABIS");
    }
  }, [totalLuasTanahBaru, oldData]);

  const handleAddField = () => {
    setNewDataList([...newDataList, { nop: "", namaWp: "", alamat: "", luasTanah: 0, luasBangunan: 0 }]);
  };

  const handleRemoveField = (index: number) => {
    if (newDataList.length > 1) {
      setNewDataList(newDataList.filter((_, i) => i !== index));
    }
  };

  const handleTelpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setTelpPemohon(cleaned.substring(0, 15));
  };

  const updateNewData = (index: number, field: keyof SpptData, value: any) => {
    const next = [...newDataList];
    next[index] = { ...next[index], [field]: value };
    setNewDataList(next);
  };

  const validateStep1 = () => {
    if (!nomorSurat) return Alert.alert("Perhatian", "Nomor Surat wajib diisi.");
    if (!pemohon) return Alert.alert("Perhatian", "Nama Pemohon wajib diisi.");
    if (nikPemohon.length !== 16) return Alert.alert("Perhatian", "NIK harus 16 digit.");
    if (telpPemohon.length < 10) return Alert.alert("Perhatian", "Nomor telepon harus minimal 10 digit.");
    if (!oldData) return Alert.alert("Perhatian", "Cari data NOP Lama terlebih dahulu.");
    setStep(2);
  };

  const validateStep2 = () => {
    for (const item of newDataList) {
      if (!item.namaWp) return Alert.alert("Perhatian", "Nama WP baru wajib diisi.");
      if (item.luasTanah <= 0) return Alert.alert("Perhatian", "Luas tanah baru harus > 0.");
    }
    setStep(3);
  };

  const handleSaveDraft = async () => {
    const payload = {
      id: `MUT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      serverUrl,
      formData: {
        dasar, pemohon, nikPemohon, telpPemohon, nomorSurat, namaKades,
        oldData, newDataList, luasSebenarnya, sisa
      }
    };

    try {
      const saved = await AsyncStorage.getItem('@mutation_drafts_v1');
      const existing = saved ? JSON.parse(saved) : [];
      const nextDrafts = [payload, ...existing].slice(0, 20);
      await AsyncStorage.setItem('@mutation_drafts_v1', JSON.stringify(nextDrafts));
      Alert.alert("Draft Tersimpan", "Data mutasi berhasil disimpan di perangkat.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan draft.");
    }
  };

  const handlePrintPdf = async () => {
    setIsExporting(true);
    try {
      const dateStrLong = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
      const html = `
        <html>
          <head>
            <style>
              body { font-family: "Times New Roman", Times, serif; padding: 40px; line-height: 1.4; color: #000; font-size: 12pt; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
              .font-bold { font-weight: bold; }
              .underline { text-decoration: underline; }
              .uppercase { text-transform: uppercase; }
              .indent { text-indent: 40px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              td { vertical-align: top; padding: 2px 0; }
              .signature { margin-top: 50px; text-align: right; margin-right: 40px; }
              .sign-space { height: 80px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div style="width: 50%">
                <p>Perihal : Perubahan Mutasi/Pemecahan</p>
                <p style="padding-left: 54px">Objek/Subjek PBB Tahun ${new Date().getFullYear()}</p>
              </div>
              <div style="width: 50%">
                <p>Kepada Yth.</p>
                <p class="font-bold">Kepala Badan Pendapatan Daerah</p>
                <p class="font-bold">Kabupaten ${villageMetadata.regencyName}</p>
                <p>di - <span class="font-bold">${villageMetadata.regencyName}</span></p>
              </div>
            </div>

            <p class="indent">Sehubungan dengan terjadinya: <b>${dasar}</b> atas nama <b>${oldData?.namaWp}</b>, kami mohon perubahan data sebagai berikut:</p>
            
            <p class="font-bold">LAMA:</p>
            <table>
              <tr><td width="180">NOP</td><td>: ${oldData?.nop}</td></tr>
              <tr><td>Nama Wajib Pajak</td><td>: ${oldData?.namaWp}</td></tr>
              <tr><td>Luas Tanah / Bangunan</td><td>: ${oldData?.luasTanah} m² / ${oldData?.luasBangunan} m²</td></tr>
            </table>

            <p class="font-bold">BARU:</p>
            ${newDataList.map((item, i) => `
              <div style="margin-bottom: 15px">
                <table>
                  <tr><td width="180">${i+1}. Nama Wajib Pajak</td><td>: ${item.namaWp}</td></tr>
                  <tr><td>Luas Tanah / Bangunan</td><td>: ${item.luasTanah} m² / ${item.luasBangunan} m²</td></tr>
                </table>
              </div>
            `).join('')}

            <p class="font-bold">Luas sebenarnya: ${luasSebenarnya} m², Status: ${sisa}</p>

            <div class="signature">
              <p>${villageMetadata.villageName}, ${dateStrLong}</p>
              <p>Hormat kami,</p>
              <div class="sign-space"></div>
              <p class="font-bold underline uppercase">${pemohon}</p>
            </div>

            <div style="page-break-before: always;"></div>

            <div class="kop">
               <p class="font-bold uppercase">PEMERINTAH KABUPATEN ${villageMetadata.regencyName}</p>
               <p class="font-bold uppercase">KECAMATAN ${villageMetadata.districtName}</p>
               <p class="font-bold" style="font-size: 16pt">KANTOR DESA ${villageMetadata.villageName}</p>
               <p style="font-size: 10pt; font-style: italic">${villageMetadata.address} | Email: ${villageMetadata.email}</p>
            </div>

            <div style="text-align: center; margin-bottom: 20px">
              <p class="font-bold underline" style="font-size: 18pt">SURAT KETERANGAN</p>
              <p>Nomor : ${nomorSurat}</p>
            </div>

            <p>Menerangkan bahwa pemohon <b>${pemohon}</b> (NIK: ${nikPemohon}) mengajukan mutasi PBB atas NOP ${oldData?.nop} menjadi data baru sebagaimana terlampir.</p>
            
            <div class="signature">
              <p>${villageMetadata.villageName}, ${dateStrLong}</p>
              <p>Kepala Desa ${villageMetadata.villageName}</p>
              <div class="sign-space"></div>
              <p class="font-bold underline">${namaKades}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Gagal melakukan cetak PDF."); }
    finally { setIsExporting(false); }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await generateMutationDocxMobile({
        dasar, pemohon, nikPemohon, telpPemohon, nomorSurat, namaKades,
        oldData: oldData!,
        newDataList,
        luasSebenarnya, sisa,
        villageName: villageMetadata.villageName,
        districtName: villageMetadata.districtName,
        regencyName: villageMetadata.regencyName,
        villageAddress: villageMetadata.address,
        villageEmail: villageMetadata.email,
        villageZip: villageMetadata.zip,
        villageLogo: villageMetadata.logoUrl
      });
    } catch (e) {
      Alert.alert("Error", "Gagal membuat file Word.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderStep1 = () => (
    <View className="space-y-4">
      <View className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
        <Text className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>1. Identitas Berkas</Text>
        <TextInput 
          className={`px-5 py-3 rounded-2xl border mb-3 font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          placeholder="Nomor Surat Keterangan"
          value={nomorSurat}
          onChangeText={setNomorSurat}
          placeholderTextColor="#94a3b8"
        />
        <TextInput 
          className={`px-5 py-3 rounded-2xl border mb-3 font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          placeholder="Nama Kepala Desa"
          value={namaKades}
          onChangeText={setNamaKades}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
        <Text className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>2. Detail Pemohon</Text>
        <TextInput 
          className={`px-5 py-3 rounded-2xl border mb-3 font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          placeholder="Nama Lengkap Pemohon"
          value={pemohon}
          onChangeText={setPemohon}
          placeholderTextColor="#94a3b8"
        />
        <TextInput 
          className={`px-5 py-3 rounded-2xl border mb-3 font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          placeholder="NIK Pemohon (16 Digit)"
          keyboardType="numeric"
          maxLength={16}
          value={nikPemohon}
          onChangeText={setNikPemohon}
          placeholderTextColor="#94a3b8"
        />
        <TextInput 
          className={`px-5 py-3 rounded-2xl border mb-3 font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          placeholder="No. Telp / WhatsApp"
          keyboardType="phone-pad"
          maxLength={15}
          value={telpPemohon}
          onChangeText={handleTelpChange}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
        <Text className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>3. Cari Data NOP Lama</Text>
        <View className="flex-row items-center space-x-2">
          <TextInput 
            className={`flex-1 px-5 py-4 rounded-2xl border font-mono font-bold ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
            placeholder="Ketik NOP..."
            value={oldNop}
            onChangeText={handleNopChange}
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity 
            onPress={handleNopSearch} 
            disabled={loadingSearch}
            className={`w-14 h-14 rounded-2xl items-center justify-center ${isDark ? 'bg-blue-600' : 'bg-indigo-600'}`}
          >
            {loadingSearch ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="search" size={24} color="white" />}
          </TouchableOpacity>
        </View>

        {oldData && (
          <View className={`mt-4 p-4 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <Text className={`text-[9px] font-black uppercase text-blue-500 mb-1`}>Status: Terdeteksi</Text>
            <Text className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{oldData.namaWp}</Text>
            <Text className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{oldData.alamat}</Text>
            <View className="flex-row mt-2 space-x-4">
              <View>
                <Text className="text-[8px] font-black text-slate-400 uppercase">Luas Tanah</Text>
                <Text className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{oldData.luasTanah} m²</Text>
              </View>
              <View>
                <Text className="text-[8px] font-black text-slate-400 uppercase">Luas Bangunan</Text>
                <Text className={`text-xs font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{oldData.luasBangunan} m²</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="space-y-4">
      <View className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
        <Text className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>4. Dasar Mutasi</Text>
        <View className="flex-row space-x-2">
          {["JUAL_BELI", "HIBAH", "WARIS"].map((r) => (
            <TouchableOpacity 
              key={r}
              onPress={() => setDasar(r as any)}
              className={`flex-1 py-3 rounded-xl border items-center ${dasar === r ? (isDark ? 'bg-blue-600 border-blue-600' : 'bg-indigo-600 border-indigo-600') : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}
            >
              <Text className={`text-[9px] font-black uppercase ${dasar === r ? 'text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{r.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="space-y-3">
        <View className="flex-row justify-between items-center ml-1">
          <Text className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>5. Breakdown Objek Baru</Text>
          <TouchableOpacity onPress={handleAddField} className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
             <Text className="text-[8px] font-black text-emerald-500 uppercase">+ Tambah Objek</Text>
          </TouchableOpacity>
        </View>

        {newDataList.map((item, idx) => (
          <View key={idx} className={`p-6 rounded-3xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[9px] font-black text-blue-500 uppercase">Objek #${idx + 1}</Text>
              {newDataList.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveField(idx)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput 
              className={`px-4 py-3 rounded-xl border mb-2 font-bold text-xs ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
              placeholder="Nama Wajib Pajak Baru"
              value={item.namaWp}
              onChangeText={(t) => updateNewData(idx, 'namaWp', t)}
              placeholderTextColor="#94a3b8"
            />
            <TextInput 
              className={`px-4 py-3 rounded-xl border mb-2 font-bold text-xs ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
              placeholder="Alamat Objek (Kosongkan jika sama)"
              value={item.alamat}
              onChangeText={(t) => updateNewData(idx, 'alamat', t)}
              placeholderTextColor="#94a3b8"
            />
            <View className="flex-row space-x-2">
              <View className="flex-1">
                <Text className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Luas Tanah (m²)</Text>
                <TextInput 
                  className={`px-4 py-3 rounded-xl border font-black text-xs ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
                  keyboardType="numeric"
                  value={item.luasTanah.toString()}
                  onChangeText={(t) => updateNewData(idx, 'luasTanah', Number(t))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Luas Banguan (m²)</Text>
                <TextInput 
                  className={`px-4 py-3 rounded-xl border font-black text-xs ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
                  keyboardType="numeric"
                  value={item.luasBangunan.toString()}
                  onChangeText={(t) => updateNewData(idx, 'luasBangunan', Number(t))}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className={`p-6 rounded-3xl border ${totalLuasTanahBaru > (oldData?.luasTanah || 0) ? 'bg-rose-500/10 border-rose-500/20' : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-900 border-slate-800')}`}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Luas Input</Text>
            <Text className={`text-2xl font-black ${totalLuasTanahBaru > (oldData?.luasTanah || 0) ? 'text-rose-500' : 'text-white'}`}>{totalLuasTanahBaru} m²</Text>
          </View>
          <View className="items-end">
            <Text className="text-[8px] font-black text-slate-400 uppercase">Limit: {oldData?.luasTanah || 0} m²</Text>
            <Text className={`text-[10px] font-bold ${totalLuasTanahBaru > (oldData?.luasTanah || 0) ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalLuasTanahBaru > (oldData?.luasTanah || 0) ? "⚠️ Melebihi Batas" : `Sisa: ${ (oldData?.luasTanah || 0) - totalLuasTanahBaru } m²`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="space-y-6">
      <View className={`p-8 rounded-[40px] items-center border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
        <View className="w-20 h-20 bg-emerald-500 rounded-[30px] items-center justify-center shadow-xl shadow-emerald-500/20 mb-6">
          <Ionicons name="checkmark-done" size={40} color="white" />
        </View>
        <Text className={`text-2xl font-black text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>BERKAS SIAP!</Text>
        <Text className={`text-center mt-2 font-medium text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Data mutasi atas nama <Text className="font-bold text-emerald-500">{pemohon}</Text> telah divalidasi dan siap untuk dicetak atau dibagikan sebagai dokumen Word.
        </Text>
      </View>

      <View className="space-y-3">
        <TouchableOpacity 
          onPress={handlePrintPdf}
          disabled={isExporting}
          className="bg-slate-900 py-5 rounded-[24px] flex-row items-center justify-center shadow-xl"
        >
          {isExporting ? <ActivityIndicator color="white" /> : (
            <>
              <Ionicons name="print-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-black uppercase tracking-widest text-[11px]">Cetak Berkas (PDF)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleExportWord}
          disabled={isExporting}
          className="bg-white py-5 rounded-[24px] flex-row items-center justify-center border border-slate-200 shadow-sm"
        >
          {isExporting ? <ActivityIndicator color="#0f172a" /> : (
            <>
              <Ionicons name="document-text-outline" size={20} color="#0f172a" style={{ marginRight: 8 }} />
              <Text className="text-slate-900 font-black uppercase tracking-widest text-[11px]">Unduh Berkas (Word)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
        <Text className="text-[9px] text-amber-800 font-bold leading-relaxed italic">
          💡 Tips: Format DOCX yang dihasilkan mengikuti standar resmi BAPENDA Jombang. Gunakan File Word jika Anda ingin melakukan pengeditan lanjutan sebelum dicetak.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header Wizard */}
      <View className={`px-8 pt-16 pb-8 border-b ${isDark ? 'bg-[#09090b] border-white/5' : 'bg-white border-slate-100'}`}>
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className={`w-12 h-12 rounded-2xl items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
             <Ionicons name="arrow-back" size={22} color={isDark ? "white" : "#0f172a"} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{step === 3 ? "Selesai" : "Mutasi PBB"}</Text>
            <Text className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Step {step} of 3</Text>
          </View>
          <View className="w-12" />
        </View>

        <View className="flex-row items-center justify-center">
          {[1, 2, 3].map((s) => (
            <View key={s} className="items-center mx-6">
               <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${step >= s ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-200'}`}>
                  {step > s ? <Ionicons name="checkmark" size={18} color="white" /> : (
                    <Text className={`font-black ${step === s ? 'text-white' : 'text-slate-300'}`}>{s}</Text>
                  )}
               </View>
            </View>
          ))}
          <View className="absolute h-[2px] w-[180px] bg-slate-100 -z-10" style={{ top: 20 }} />
          <View className="absolute h-[2px] bg-blue-600 -z-10" style={{ top: 20, width: step === 1 ? 0 : step === 2 ? 90 : 180, left: '26%' }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Persistent Footer Actions */}
      <View className={`absolute bottom-0 left-0 right-0 p-8 pt-4 pb-10 border-t ${isDark ? 'bg-[#09090b] border-white/5' : 'bg-white border-slate-100'}`}>
        <View className="flex-row space-x-3">
          {step > 1 && step < 3 && (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)}
              className={`flex-1 py-5 rounded-[24px] items-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
            >
              <Text className={`font-black uppercase tracking-widest text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kembali</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={step === 1 ? validateStep1 : step === 2 ? validateStep2 : handleSaveDraft}
            className={`flex-[2] py-5 rounded-[24px] items-center shadow-lg ${isDark ? 'bg-blue-600 shadow-blue-600/20' : 'bg-indigo-600 shadow-indigo-600/30'}`}
          >
            <Text className="text-white font-black uppercase tracking-widest text-[10px]">
              {step === 1 ? "Lanjut ke Objek Baru" : step === 2 ? "Lihat Hasil Akhir" : "Simpan Berkas Mutasi"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
