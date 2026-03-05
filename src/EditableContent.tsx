import { useEffect, useState } from "react";
import style from "./EditableContent.module.css";

/**
 * A style-less component that allows for text to be modified. Meant to mimic the contentEditable atribute in a reactish way.
 * 
 * @param {boolean} disabled - Determines whether the text is editable.
 * @param {string | undefined} placeholder - Acts as the placeholder text in the input field when editing.
 * @param {string | number | undefined} fontSize - Used directly as the fontSize style property.
 * @param {(value: string) => void} onSumbit - A callback triggered when the component loses focus or the 'return'/'enter' key is pressed.
 * @param {(value: string) => void} onChange - A callback triggered whenever the editable content changes.
 * @param {string | null} children - A string which is used to set the initial value of the editable content. This value is not updated when the content is edited and instead, onChange or onSubmit should be used. However, if this value changes, the display will update to show the most recent value.
 */
function EditableContent({ disabled, placeholder, fontSize, onSubmit, onChange, children }: {
    placeholder?: string,
    disabled?: boolean,
    fontSize?: string | number,
    onClick?: () => void,
    onSubmit?: (value: string) => void,
    onChange?: (value: string) => void
    children: string | null
}) {
    const [localContentValue, setLocalContentValue] = useState<string>(children ?? "");
    const [editing, setEditing] = useState<boolean>(false);

    // blur is the hmtl term for losing focus
    function handleBlur(newValue: string) {
        if (newValue !== children && onSubmit) {
            onSubmit(newValue);
        }
        editing && setEditing(false);
    }

    useEffect(() => {
        setLocalContentValue(children ?? "");
    }, [children]);

    // Without this hook, the component might become disabled while editing (due to some external listener, for example), in which case onBlur won't fire since the input field no longer exists. This hook reconciles state.
    useEffect(() => {
        disabled && handleBlur(localContentValue);
    }, [disabled]);
    return (
        <div className={style.container}>
            {/* {editing ? <div style={{ fontWeight: "bold" }}>Editing</div> : null}
            {disabled ? <div style={{ fontWeight: "bold" }}>Disabled</div> : null} */}
            {!disabled && editing ?
                <input
                    className={style.input}
                    type="text"
                    placeholder={placeholder}
                    value={localContentValue}
                    size={localContentValue.length}
                    autoFocus
                    onChange={(e) => {
                        onChange && onChange(e.target.value);
                        setLocalContentValue(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        e.key === "Enter" && (e.target as HTMLInputElement).blur();
                    }}
                    onBlur={(e) => {
                        handleBlur(e.target.value);
                    }}
                    style={{ fontSize: fontSize }}
                />
                :
                <span
                    className={style.static}
                    onClick={() => {
                        !disabled && setEditing(true);
                    }}
                    style={{ fontSize: fontSize }}
                >
                    {localContentValue}
                </span>
            }

        </div>
    )
}

export default EditableContent;