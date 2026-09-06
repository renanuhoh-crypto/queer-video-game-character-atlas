"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import styles from "./Quiu3DMascot.module.css";

const DynamicQuiu3D = dynamic(() => import("./Quiu3DMascot"), {
  ssr: false,
  loading: () => (
    <div
      className={styles.scene}
      role="img"
      aria-label="Quiu, the Press Q guide. The interactive three-dimensional model is loading."
      data-loading="true"
    >
      <Image
        src="/press-q-icon.png"
        alt=""
        width={624}
        height={667}
        priority
        loading="eager"
        className={`${styles.poster} ${styles.posterLoading}`}
        aria-hidden="true"
      />
      <p className={styles.label} aria-hidden="true">Model / Q-01</p>
      <p className={styles.status} aria-hidden="true">Loading archive guide</p>
    </div>
  ),
});

export default function Quiu3DStage() {
  return <DynamicQuiu3D />;
}
