import { useEffect, useMemo, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  FolderTree,
  Image,
  Link2,
  Loader2,
  LogOut,
  Megaphone,
  Package,
  Plus,
  Save,
  Send,
  Settings,
  Tags,
  Trash2,
  Upload,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import type { Category, ContactIconType, ContactLink, Product, SiteData, SiteSettings } from "../data/products";
import { getFallbackSiteData, getProductCategories } from "../data/products";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  deleteAdminProductMedia,
  fetchAdminBootstrap,
  fetchAdminBroadcastStats,
  fetchAdminMe,
  loginAdmin,
  loginAdminWithTelegramToken,
  logoutAdmin,
  saveAdminContacts,
  saveAdminSettings,
  sendAdminBroadcast,
  updateAdminCategory,
  updateAdminProduct,
  uploadAdminProductMedia,
} from "../services/api";
import "./admin.css";

type AdminSection = "prodotti" | "categorie" | "contatti" | "broadcast" | "settings";

const contactTypes: ContactIconType[] = ["links", "instagram", "telegram", "message", "signal", "user"];

const adminSections: Array<{ id: AdminSection; label: string; icon: ReactNode }> = [
  { id: "prodotti", label: "Prodotti", icon: <Package size={18} /> },
  { id: "categorie", label: "Categorie", icon: <Tags size={18} /> },
  { id: "contatti", label: "Contatti", icon: <Link2 size={18} /> },
  { id: "broadcast", label: "Broadcast", icon: <Megaphone size={18} /> },
  { id: "settings", label: "Impostazioni", icon: <Settings size={18} /> },
];

function blankProduct(category = ""): Product {
  return {
    id: "",
    name: "",
    shortDescription: "",
    fullDescription: "",
    origin: "Jungle Roma",
    effects: [],
    images: [],
    videos: [],
    videoUrl: "",
    prices: [
      { label: "25g", price: 0 },
      { label: "50g", price: 0 },
    ],
    category,
    categories: category ? [category] : [],
    badge: "",
    isActive: true,
  };
}

function uniqueCategories(categories: string[]) {
  const cleaned = categories.map((item) => item.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.slice(0, 3);
}

function compactProduct(product: Product): Product {
  const videos = product.videos || [];
  const categories = uniqueCategories(Array.isArray(product.categories) ? product.categories : [product.category]);

  return {
    ...product,
    name: product.name.trim(),
    shortDescription: product.shortDescription.trim(),
    fullDescription: product.fullDescription.trim(),
    origin: product.origin.trim(),
    effects: product.effects.map((effect) => effect.trim()).filter(Boolean),
    images: (product.images || []).filter(Boolean).slice(0, 5),
    videos: videos.filter(Boolean).slice(0, 3),
    videoUrl: (product.videoUrl || videos[0] || "").trim(),
    prices: product.prices
      .map((price) => ({ label: price.label.trim(), price: Number(price.price) }))
      .filter((price) => price.label && Number.isFinite(price.price)),
    category: categories[0] || "",
    categories,
    badge: product.badge?.trim() || "",
    isActive: product.isActive !== false,
  };
}

function hydrateProduct(product: Product): Product {
  const categories = uniqueCategories(Array.isArray(product.categories) ? product.categories : getProductCategories(product));
  return {
    ...product,
    categories,
    category: categories[0] || "",
    images: product.images || [],
    videos: product.videos || [],
  };
}

function updateProductInData(data: SiteData, product: Product): SiteData {
  const hydrated = hydrateProduct(product);
  const exists = data.products.some((item) => item.id === product.id);
  return {
    ...data,
    products: exists
      ? data.products.map((item) => (item.id === product.id ? hydrated : item))
      : [hydrated, ...data.products],
  };
}

function isUnsavedProduct(product: Product) {
  return !product.id;
}

function consumeAdminLoginTokenFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("adminLoginToken") || "";
  if (!token) return "";

  url.searchParams.delete("adminLoginToken");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export default function AdminApp() {
  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loginName, setLoginName] = useState("admin");
  const [password, setPassword] = useState("");
  const [data, setData] = useState<SiteData>(() => getFallbackSiteData());
  const [section, setSection] = useState<AdminSection>("prodotti");
  const [draft, setDraft] = useState<Product>(() => blankProduct());
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [notifyNewProduct, setNotifyNewProduct] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const categoryNames = useMemo(
    () => Array.from(new Set(data.categories.map((category) => category.name))),
    [data.categories],
  );

  const loadAdminData = async () => {
    const nextData = await fetchAdminBootstrap();
    const hydratedData = {
      ...nextData,
      products: nextData.products.map(hydrateProduct),
      broadcast: nextData.broadcast || { subscriberCount: 0, totalSubscriberCount: 0 },
    };
    setData(hydratedData);
    const firstProduct = hydratedData.products[0];
    if (firstProduct) {
      setSelectedProductId(firstProduct.id);
      setDraft(firstProduct);
    } else {
      setSelectedProductId("");
      setDraft(blankProduct(nextData.categories[0]?.name));
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const adminLoginToken = consumeAdminLoginTokenFromUrl();
      const { user } = adminLoginToken
        ? await loginAdminWithTelegramToken(adminLoginToken)
        : await fetchAdminMe();

      if (cancelled) return;
      setUsername(user.username);
      await loadAdminData();
    }

    boot()
      .catch((error) => {
        if (cancelled) return;
        setUsername(null);
        if (error instanceof Error && error.message.includes("Token admin")) {
          setMessage(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const runAction = async (action: () => Promise<void>, success?: string) => {
    setBusy(true);
    setMessage("");

    try {
      await action();
      if (success) setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    runAction(async () => {
      const { user } = await loginAdmin(loginName, password);
      setUsername(user.username);
      setPassword("");
      await loadAdminData();
    });
  };

  const handleLogout = () => {
    runAction(async () => {
      await logoutAdmin();
      setUsername(null);
      setPassword("");
    });
  };

  const selectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setDraft(hydrateProduct(product));
    setNotifyNewProduct(false);
    setMessage("");
  };

  const createProductDraft = () => {
    const product = blankProduct(categoryNames[0] || "");
    setSelectedProductId("");
    setDraft(product);
    setNotifyNewProduct(false);
    setSection("prodotti");
    setMessage("");
  };

  const saveProduct = () => {
    runAction(async () => {
      const payload = compactProduct(draft);
      const isNewProduct = isUnsavedProduct(payload);
      const createResult = isNewProduct
        ? await createAdminProduct(payload, { notifyTelegram: notifyNewProduct })
        : null;
      const saved = createResult
        ? createResult.product
        : await updateAdminProduct(payload);

      setData((current) => updateProductInData(current, saved));
      setSelectedProductId(saved.id);
      setDraft(saved);
      setNotifyNewProduct(false);

      if (createResult?.broadcast) {
        setData((current) => ({
          ...current,
          broadcast: {
            subscriberCount: createResult.broadcast?.subscriberCount ?? current.broadcast?.subscriberCount ?? 0,
            totalSubscriberCount: current.broadcast?.totalSubscriberCount,
          },
        }));
        setMessage(`Prodotto salvato. Broadcast inviato a ${createResult.broadcast.sent} iscritti.`);
        return;
      }

      if (createResult?.broadcastError) {
        setMessage(`Prodotto salvato. Broadcast non inviato: ${createResult.broadcastError}`);
        return;
      }

      setMessage("Prodotto salvato");
    });
  };

  const removeProduct = (product: Product) => {
    if (!product.id || !window.confirm(`Eliminare ${product.name}?`)) return;

    runAction(async () => {
      const products = await deleteAdminProduct(product.id);
      setData((current) => ({ ...current, products }));
      const next = products[0] || blankProduct(categoryNames[0] || "");
      setSelectedProductId(next.id || "");
      setDraft(next);
    }, "Prodotto eliminato");
  };

  const uploadMedia = (images: File[] = [], videos: File[] = []) => {
    if (!draft.id) {
      setMessage("Salva prima il prodotto.");
      return;
    }

    runAction(async () => {
      const saved = await uploadAdminProductMedia(
        draft.id,
        images,
        videos,
      );
      setData((current) => updateProductInData(current, saved));
      setDraft(saved);
    }, "Media caricati");
  };

  const deleteMedia = (url: string) => {
    if (!draft.id || !window.confirm("Eliminare questo media?")) return;

    runAction(async () => {
      const saved = await deleteAdminProductMedia(draft.id, url);
      setData((current) => updateProductInData(current, saved));
      setDraft(saved);
    }, "Media eliminato");
  };

  const saveSettings = (settings: SiteSettings) => {
    runAction(async () => {
      const saved = await saveAdminSettings(settings);
      setData((current) => ({ ...current, settings: saved }));
    }, "Settings salvati");
  };

  const saveContacts = () => {
    runAction(async () => {
      const saved = await saveAdminContacts(data.contacts);
      setData((current) => ({ ...current, contacts: saved }));
    }, "Contatti salvati");
  };

  const sendBroadcast = (messageText: string, buttonText: string) => {
    runAction(async () => {
      const result = await sendAdminBroadcast(messageText, buttonText);
      const stats = await fetchAdminBroadcastStats();
      setData((current) => ({ ...current, broadcast: stats }));
      setMessage(`Broadcast inviato a ${result.sent} iscritti. Errori: ${result.failed}.`);
    });
  };

  const addContact = () => {
    setData((current) => ({
      ...current,
      contacts: [
        ...current.contacts,
        {
          id: `contact-${Date.now()}`,
          title: "NUOVO LINK",
          detail: "",
          handle: "",
          href: "https://",
          type: "links",
          wide: false,
        },
      ],
    }));
  };

  const updateContact = (index: number, patch: Partial<ContactLink>) => {
    setData((current) => ({
      ...current,
      contacts: current.contacts.map((contact, itemIndex) => (
        itemIndex === index ? { ...contact, ...patch } : contact
      )),
    }));
  };

  const removeContact = (index: number) => {
    setData((current) => ({
      ...current,
      contacts: current.contacts.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addCategory = () => {
    runAction(async () => {
      const category = await createAdminCategory(newCategoryName);
      setNewCategoryName("");
      setData((current) => ({ ...current, categories: [...current.categories, category] }));
    }, "Categoria aggiunta");
  };

  const renameCategory = (category: Category, name: string) => {
    runAction(async () => {
      await updateAdminCategory(category.id, name);
      await loadAdminData();
    }, "Categoria aggiornata");
  };

  const removeCategory = (category: Category) => {
    if (!window.confirm(`Eliminare categoria ${category.name}?`)) return;

    runAction(async () => {
      await deleteAdminCategory(category.id);
      await loadAdminData();
    }, "Categoria eliminata");
  };

  if (!authChecked) {
    return (
      <div className="admin-page admin-center">
        <Loader2 className="admin-spin" size={28} />
      </div>
    );
  }

  if (!username) {
    return (
      <div className="admin-page admin-center">
        <form className="admin-login" onSubmit={handleLogin}>
          <div>
            <p className="admin-kicker">Jungle Roma</p>
            <h1>Admin</h1>
          </div>
          <label>
            Login
            <input value={loginName} onChange={(event) => setLoginName(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          {message && <p className="admin-message">{message}</p>}
          <button type="submit" disabled={busy}>
            {busy ? <Loader2 className="admin-spin" size={17} /> : <Save size={17} />}
            Entra
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-kicker">Jungle Roma</p>
          <h1>Admin</h1>
        </div>
        <nav>
          {adminSections.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? "is-active" : ""}
              onClick={() => setSection(item.id)}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={handleLogout} type="button">
          <LogOut size={17} />
          Esci
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Accesso: {username}</p>
            <h2>{adminSections.find((item) => item.id === section)?.label}</h2>
          </div>
          {message && <p className="admin-message">{message}</p>}
        </header>

        <div className="admin-stats">
          <div>
            <span>Prodotti</span>
            <strong>{data.products.length}</strong>
          </div>
          <div>
            <span>Attivi</span>
            <strong>{data.products.filter((product) => product.isActive !== false).length}</strong>
          </div>
          <div>
            <span>Categorie</span>
            <strong>{data.categories.length}</strong>
          </div>
          <div>
            <span>Media</span>
            <strong>{data.products.reduce((total, product) => total + (product.images?.length || 0) + (product.videos?.length || 0), 0)}</strong>
          </div>
          <div>
            <span>Iscritti bot</span>
            <strong>{data.broadcast?.subscriberCount ?? 0}</strong>
          </div>
        </div>

        {section === "prodotti" && (
          <CatalogAdmin
            busy={busy}
            categoryNames={categoryNames}
            draft={draft}
            products={data.products}
            selectedProductId={selectedProductId}
            onCreate={createProductDraft}
            onDelete={removeProduct}
            onDeleteMedia={deleteMedia}
            onDraftChange={setDraft}
            notifyNewProduct={notifyNewProduct}
            onSave={saveProduct}
            onSelect={selectProduct}
            onNotifyNewProductChange={setNotifyNewProduct}
            onUpload={uploadMedia}
          />
        )}

        {section === "categorie" && (
          <CategoriesAdmin
            categories={data.categories}
            newCategoryName={newCategoryName}
            onAdd={addCategory}
            onDelete={removeCategory}
            onNameChange={setNewCategoryName}
            onRename={renameCategory}
          />
        )}

        {section === "contatti" && (
          <ContactsAdmin
            contacts={data.contacts}
            onAdd={addContact}
            onDelete={removeContact}
            onSave={saveContacts}
            onUpdate={updateContact}
          />
        )}

        {section === "broadcast" && (
          <BroadcastAdmin
            busy={busy}
            subscriberCount={data.broadcast?.subscriberCount ?? 0}
            totalSubscriberCount={data.broadcast?.totalSubscriberCount ?? data.broadcast?.subscriberCount ?? 0}
            onSend={sendBroadcast}
          />
        )}

        {section === "settings" && (
          <SettingsAdmin settings={data.settings} onSave={saveSettings} onUpdate={(settings) => {
            setData((current) => ({ ...current, settings }));
          }} />
        )}
      </main>
    </div>
  );
}

function CatalogAdmin({
  busy,
  categoryNames,
  draft,
  products,
  selectedProductId,
  onCreate,
  onDelete,
  onDeleteMedia,
  onDraftChange,
  notifyNewProduct,
  onSave,
  onSelect,
  onNotifyNewProductChange,
  onUpload,
}: {
  busy: boolean;
  categoryNames: string[];
  draft: Product;
  notifyNewProduct: boolean;
  products: Product[];
  selectedProductId: string;
  onCreate: () => void;
  onDelete: (product: Product) => void;
  onDeleteMedia: (url: string) => void;
  onDraftChange: (product: Product) => void;
  onSave: () => void;
  onSelect: (product: Product) => void;
  onNotifyNewProductChange: (value: boolean) => void;
  onUpload: (images: File[], videos: File[]) => void;
}) {
  return (
    <div className="admin-grid">
      <section className="admin-panel admin-product-list">
        <div className="admin-panel-head">
          <h3>Prodotti</h3>
          <button type="button" onClick={onCreate}>
            <Plus size={16} />
            Nuovo
          </button>
        </div>
        <div className="admin-list">
          {products.map((product) => (
            <button
              key={product.id}
              className={selectedProductId === product.id ? "is-active" : ""}
              onClick={() => onSelect(product)}
              type="button"
            >
              <span>
                <strong>{product.name}</strong>
                <small>{getProductCategories(product).join(" / ")}</small>
              </span>
              {product.isActive === false ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-panel admin-editor">
        <div className="admin-panel-head">
          <h3>{draft.id ? draft.name || "Prodotto" : "Nuovo prodotto"}</h3>
          <div className="admin-actions">
            <button type="button" onClick={onSave} disabled={busy}>
              {busy ? <Loader2 className="admin-spin" size={16} /> : <Save size={16} />}
              Salva
            </button>
            {draft.id && (
              <button type="button" className="danger" onClick={() => onDelete(draft)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="admin-form-grid">
          <label>
            Nome
            <input value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} />
          </label>
          <CategoryPicker
            categories={categoryNames}
            selected={getProductCategories(draft)}
            onChange={(categories) => onDraftChange({ ...draft, categories, category: categories[0] || "" })}
          />
          <label>
            Badge
            <input value={draft.badge || ""} onChange={(event) => onDraftChange({ ...draft, badge: event.target.value })} />
          </label>
          <label>
            Origine
            <input value={draft.origin} onChange={(event) => onDraftChange({ ...draft, origin: event.target.value })} />
          </label>
          <label className="wide">
            Short description
            <input
              value={draft.shortDescription}
              onChange={(event) => onDraftChange({ ...draft, shortDescription: event.target.value })}
            />
          </label>
          <label className="wide">
            Full description
            <textarea
              value={draft.fullDescription}
              onChange={(event) => onDraftChange({ ...draft, fullDescription: event.target.value })}
            />
          </label>
          <label className="wide">
            Effetti / tags
            <input
              value={draft.effects.join(", ")}
              onChange={(event) => onDraftChange({
                ...draft,
                effects: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
              })}
            />
          </label>
          <label className="admin-check">
            <input
              checked={draft.isActive !== false}
              onChange={(event) => onDraftChange({ ...draft, isActive: event.target.checked })}
              type="checkbox"
            />
            Visibile sul sito
          </label>
          {!draft.id && (
            <label className="admin-check">
              <input
                checked={notifyNewProduct}
                onChange={(event) => onNotifyNewProductChange(event.target.checked)}
                type="checkbox"
              />
              Invia broadcast Telegram dopo il salvataggio
            </label>
          )}
        </div>

        <PriceEditor draft={draft} onDraftChange={onDraftChange} />

        <MediaEditor
          draft={draft}
          onDeleteMedia={onDeleteMedia}
          onUpload={onUpload}
        />
      </section>
    </div>
  );
}

function CategoryPicker({
  categories,
  selected,
  onChange,
}: {
  categories: string[];
  selected: string[];
  onChange: (categories: string[]) => void;
}) {
  const selectedSet = new Set(selected);

  const toggle = (category: string) => {
    if (selectedSet.has(category)) {
      const next = selected.filter((item) => item !== category);
      onChange(next);
      return;
    }

    if (selected.length >= 3) return;
    onChange([...selected, category]);
  };

  return (
    <div className="admin-field wide">
      <div className="admin-field-label">
        <span>Categorie prodotto</span>
        <small>{selected.length}/3</small>
      </div>
      <div className="admin-category-picker">
        {categories.map((category) => {
          const active = selectedSet.has(category);
          const disabled = !active && selected.length >= 3;

          return (
            <button
              key={category}
              type="button"
              className={active ? "is-selected" : ""}
              disabled={disabled}
              onClick={() => toggle(category)}
            >
              <FolderTree size={15} />
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceEditor({
  draft,
  onDraftChange,
}: {
  draft: Product;
  onDraftChange: (product: Product) => void;
}) {
  const prices = draft.prices.length ? draft.prices : [{ label: "", price: 0 }];

  const updatePrice = (index: number, patch: Partial<Product["prices"][number]>) => {
    onDraftChange({
      ...draft,
      prices: prices.map((price, itemIndex) => (
        itemIndex === index ? { ...price, ...patch } : price
      )),
    });
  };

  return (
    <div className="admin-subsection">
      <div className="admin-panel-head compact">
        <h4>Prezzi</h4>
        <button type="button" onClick={() => onDraftChange({ ...draft, prices: [...prices, { label: "", price: 0 }] })}>
          <Plus size={15} />
          Prezzo
        </button>
      </div>
      <div className="admin-price-grid">
        {prices.map((price, index) => (
          <div className="admin-price-row" key={`${price.label}-${index}`}>
            <input
              placeholder="Label"
              value={price.label}
              onChange={(event) => updatePrice(index, { label: event.target.value })}
            />
            <input
              min="0"
              placeholder="Prezzo"
              type="number"
              value={price.price}
              onChange={(event) => updatePrice(index, { price: Number(event.target.value) })}
            />
            <button
              type="button"
              className="danger"
              onClick={() => onDraftChange({ ...draft, prices: prices.filter((_, itemIndex) => itemIndex !== index) })}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaEditor({
  draft,
  onDeleteMedia,
  onUpload,
}: {
  draft: Product;
  onDeleteMedia: (url: string) => void;
  onUpload: (images: File[], videos: File[]) => void;
}) {
  const [queuedImages, setQueuedImages] = useState<File[]>([]);
  const [queuedVideos, setQueuedVideos] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const images = draft.images || [];
  const videos = draft.videos || [];
  const imageSlots = Math.max(0, 5 - images.length);
  const videoSlots = Math.max(0, 3 - videos.length);
  const queuedTotal = queuedImages.length + queuedVideos.length;

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));

    setQueuedImages((current) => [...current, ...imageFiles].slice(0, imageSlots));
    setQueuedVideos((current) => [...current, ...videoFiles].slice(0, videoSlots));
  };

  const uploadQueued = () => {
    onUpload(queuedImages, queuedVideos);
    setQueuedImages([]);
    setQueuedVideos([]);
  };

  const preventDropDefaults = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="admin-subsection">
      <div
        className={`admin-media-dropzone ${isDragging ? "is-dragging" : ""} ${!draft.id ? "is-disabled" : ""}`}
        onDragEnter={(event) => {
          preventDropDefaults(event);
          setIsDragging(true);
        }}
        onDragOver={preventDropDefaults}
        onDragLeave={(event) => {
          preventDropDefaults(event);
          setIsDragging(false);
        }}
        onDrop={(event) => {
          preventDropDefaults(event);
          setIsDragging(false);
          if (!draft.id) return;
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <div className="admin-media-drop-icon">
          <UploadCloud size={28} />
        </div>
        <div>
          <strong>Caricamento media</strong>
          <span>Foto {images.length}/5, video {videos.length}/3. Trascina i file qui o scegli manualmente.</span>
        </div>
        <div className="admin-media-upload">
          <label>
            <Image size={17} />
            Foto
            <input
              accept="image/*"
              disabled={!draft.id || imageSlots === 0}
              multiple
              type="file"
              onChange={(event) => {
                addFiles(Array.from(event.target.files || []));
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label>
            <Video size={17} />
            Video
            <input
              accept="video/*"
              disabled={!draft.id || videoSlots === 0}
              multiple
              type="file"
              onChange={(event) => {
                addFiles(Array.from(event.target.files || []));
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {queuedTotal > 0 && (
        <div className="admin-upload-queue">
          <div className="admin-panel-head compact">
            <h4>Coda upload</h4>
            <div className="admin-actions">
              <button type="button" onClick={() => { setQueuedImages([]); setQueuedVideos([]); }}>
                <X size={15} />
                Svuota
              </button>
              <button type="button" onClick={uploadQueued}>
                <Upload size={15} />
                Carica {queuedTotal}
              </button>
            </div>
          </div>
          <div className="admin-queue-grid">
            {queuedImages.map((file, index) => (
              <div className="admin-queue-item" key={`${file.name}-${index}`}>
                <Image size={15} />
                <span>{file.name}</span>
              </div>
            ))}
            {queuedVideos.map((file, index) => (
              <div className="admin-queue-item" key={`${file.name}-${index}`}>
                <Video size={15} />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-media-grid">
        {images.map((url) => (
          <figure key={url}>
            <img src={url} alt="" />
            <button type="button" onClick={() => onDeleteMedia(url)}>
              <Trash2 size={15} />
            </button>
          </figure>
        ))}
        {videos.map((url) => (
          <figure key={url}>
            <video src={url} controls />
            <button type="button" onClick={() => onDeleteMedia(url)}>
              <Trash2 size={15} />
            </button>
          </figure>
        ))}
      </div>
      {!draft.id && <p className="admin-muted"><Upload size={15} /> Salva il prodotto per caricare media.</p>}
    </div>
  );
}

function CategoriesAdmin({
  categories,
  newCategoryName,
  onAdd,
  onDelete,
  onNameChange,
  onRename,
}: {
  categories: Category[];
  newCategoryName: string;
  onAdd: () => void;
  onDelete: (category: Category) => void;
  onNameChange: (name: string) => void;
  onRename: (category: Category, name: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts(Object.fromEntries(categories.map((category) => [category.id, category.name])));
  }, [categories]);

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>Categorie</h3>
        <div className="admin-inline-form">
          <input value={newCategoryName} onChange={(event) => onNameChange(event.target.value)} placeholder="Nome categoria" />
          <button type="button" onClick={onAdd}>
            <Plus size={16} />
            Crea
          </button>
        </div>
      </div>
      <div className="admin-stack">
        {categories.map((category) => (
          <div className="admin-row" key={category.id}>
            <input
              value={drafts[category.id] ?? category.name}
              onChange={(event) => setDrafts((current) => ({ ...current, [category.id]: event.target.value }))}
            />
            <button type="button" onClick={() => onRename(category, drafts[category.id] ?? category.name)}>
              <Save size={16} />
            </button>
            <button type="button" className="danger" onClick={() => onDelete(category)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactsAdmin({
  contacts,
  onAdd,
  onDelete,
  onSave,
  onUpdate,
}: {
  contacts: ContactLink[];
  onAdd: () => void;
  onDelete: (index: number) => void;
  onSave: () => void;
  onUpdate: (index: number, patch: Partial<ContactLink>) => void;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>Contatti</h3>
        <div className="admin-actions">
          <button type="button" onClick={onAdd}>
            <Plus size={16} />
            Link
          </button>
          <button type="button" onClick={onSave}>
            <Save size={16} />
            Salva
          </button>
        </div>
      </div>
      <div className="admin-contact-list">
        {contacts.map((contact, index) => (
          <div className="admin-contact-row" key={contact.id || index}>
            <input value={contact.title} onChange={(event) => onUpdate(index, { title: event.target.value })} placeholder="Titolo" />
            <input value={contact.detail} onChange={(event) => onUpdate(index, { detail: event.target.value })} placeholder="Dettaglio" />
            <input value={contact.handle} onChange={(event) => onUpdate(index, { handle: event.target.value })} placeholder="Handle" />
            <input className="wide" value={contact.href} onChange={(event) => onUpdate(index, { href: event.target.value })} placeholder="URL" />
            <select value={contact.type} onChange={(event) => onUpdate(index, { type: event.target.value as ContactIconType })}>
              {contactTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <label className="admin-check compact">
              <input checked={contact.wide === true} onChange={(event) => onUpdate(index, { wide: event.target.checked })} type="checkbox" />
              Wide
            </label>
            <button type="button" className="danger" onClick={() => onDelete(index)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function BroadcastAdmin({
  busy,
  subscriberCount,
  totalSubscriberCount,
  onSend,
}: {
  busy: boolean;
  subscriberCount: number;
  totalSubscriberCount: number;
  onSend: (message: string, buttonText: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("Apri Mini App");
  const canSend = message.trim().length > 0 && subscriberCount > 0 && !busy;

  return (
    <section className="admin-panel admin-settings">
      <div className="admin-panel-head">
        <div>
          <h3>Broadcast Telegram</h3>
          <p className="admin-muted">
            {subscriberCount} iscritti attivi
            {totalSubscriberCount !== subscriberCount ? ` / ${totalSubscriberCount} totali` : ""}
          </p>
        </div>
        <button type="button" disabled={!canSend} onClick={() => onSend(message, buttonText)}>
          {busy ? <Loader2 className="admin-spin" size={16} /> : <Send size={16} />}
          Invia
        </button>
      </div>

      <label>
        Testo messaggio
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Scrivi il messaggio da inviare agli iscritti Telegram..."
        />
      </label>

      <label>
        Testo pulsante Mini App
        <input value={buttonText} onChange={(event) => setButtonText(event.target.value)} />
      </label>

      {subscriberCount === 0 && (
        <p className="admin-muted">
          Nessun iscritto attivo. Gli utenti vengono aggiunti quando scrivono al bot o usano /start.
        </p>
      )}
    </section>
  );
}

function SettingsAdmin({
  settings,
  onSave,
  onUpdate,
}: {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => void;
  onUpdate: (settings: SiteSettings) => void;
}) {
  return (
    <section className="admin-panel admin-settings">
      <div className="admin-panel-head">
        <h3>Impostazioni</h3>
        <button type="button" onClick={() => onSave(settings)}>
          <Save size={16} />
          Salva
        </button>
      </div>
      <label>
        Telegram username
        <input value={settings.telegramUsername} onChange={(event) => onUpdate({ ...settings, telegramUsername: event.target.value })} />
      </label>
      <label>
        Telegram URL
        <input value={settings.telegramUrl} onChange={(event) => onUpdate({ ...settings, telegramUrl: event.target.value })} />
      </label>
      <label>
        Link ordine prodotti
        <input value={settings.orderUrl} onChange={(event) => onUpdate({ ...settings, orderUrl: event.target.value })} />
      </label>
    </section>
  );
}
